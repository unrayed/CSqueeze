import { useState, useCallback } from 'react';
import type { VideoMetadata } from '../types';
import { extractVideoMetadata, generateVideoThumbnail } from '../lib/videoMetadata';

interface UseVideoMetadataReturn {
  metadata: VideoMetadata | null;
  thumbnail: string | null;
  isLoading: boolean;
  error: string | null;
  loadMetadata: (file: File) => Promise<void>;
  reset: () => void;
}

export function useVideoMetadata(): UseVideoMetadataReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setMetadata(null);
    setThumbnail(null);

    try {
      // Load metadata and thumbnail in parallel
      const [meta, thumb] = await Promise.all([
        extractVideoMetadata(file),
        generateVideoThumbnail(file, 1).catch(() => null), // Don't fail if thumbnail fails
      ]);

      setMetadata(meta);
      setThumbnail(thumb);
    } catch (err) {
      console.error('Failed to extract video metadata:', err);
      const message = err instanceof Error ? err.message : 'Failed to load video metadata';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMetadata(null);
    setThumbnail(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    metadata,
    thumbnail,
    isLoading,
    error,
    loadMetadata,
    reset,
  };
}
