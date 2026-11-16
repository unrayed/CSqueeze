import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoMetadata } from '../types';
import { extractVideoMetadata, generateVideoThumbnail } from '../lib/videoMetadata';

interface UseVideoMetadataReturn {
  metadata: VideoMetadata | null;
  thumbnailUrl: string | null;
  isLoading: boolean;
  error: string | null;
  loadMetadata: (file: File) => Promise<void>;
  reset: () => void;
}

export function useVideoMetadata(): UseVideoMetadataReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thumbnailRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  const revokeThumbnail = useCallback(() => {
    if (thumbnailRef.current) {
      URL.revokeObjectURL(thumbnailRef.current);
      thumbnailRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      revokeThumbnail();
    };
  }, [revokeThumbnail]);

  const loadMetadata = useCallback(
    async (file: File) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      revokeThumbnail();
      setMetadata(null);
      setThumbnailUrl(null);
      setError(null);
      setIsLoading(true);

      try {
        const meta = await extractVideoMetadata(file);
        if (requestRef.current !== requestId || !mountedRef.current) return;

        setMetadata(meta);
        setError(null);

        const thumbnailTime = Math.min(1, Math.max(0, meta.duration * 0.1));
        try {
          const url = await generateVideoThumbnail(file, thumbnailTime);
          if (requestRef.current !== requestId || !mountedRef.current) {
            URL.revokeObjectURL(url);
            return;
          }
          thumbnailRef.current = url;
          setThumbnailUrl(url);
        } catch {
          if (requestRef.current === requestId && mountedRef.current) {
            setThumbnailUrl(null);
          }
        }
      } catch (loadError) {
        if (requestRef.current !== requestId || !mountedRef.current) return;
        const message =
          loadError instanceof Error ? loadError.message : 'Failed to read that video.';
        setError(message);
        setMetadata(null);
        setThumbnailUrl(null);
      } finally {
        if (requestRef.current === requestId && mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [revokeThumbnail]
  );

  const reset = useCallback(() => {
    requestRef.current += 1;
    revokeThumbnail();
    setMetadata(null);
    setThumbnailUrl(null);
    setIsLoading(false);
    setError(null);
  }, [revokeThumbnail]);

  return {
    metadata,
    thumbnailUrl,
    isLoading,
    error,
    loadMetadata,
    reset,
  };
}
