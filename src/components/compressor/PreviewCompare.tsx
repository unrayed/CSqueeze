import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import { formatBytes, formatDuration } from '../../lib/utils';

interface PreviewCompareProps {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
}

export function PreviewCompare({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
}: PreviewCompareProps) {
  const originalRef = useRef<HTMLVideoElement>(null);
  const compressedRef = useRef<HTMLVideoElement>(null);
  const playbackRequest = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    playbackRequest.current += 1;
    originalRef.current?.pause();
    compressedRef.current?.pause();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [originalUrl, compressedUrl]);

  useEffect(() => {
    return () => {
      originalRef.current?.pause();
      compressedRef.current?.pause();
    };
  }, []);

  const pauseBoth = () => {
    playbackRequest.current += 1;
    originalRef.current?.pause();
    compressedRef.current?.pause();
    setPlaying(false);
  };

  const togglePlayback = () => {
    if (playing) {
      pauseBoth();
      return;
    }

    const original = originalRef.current;
    const compressed = compressedRef.current;
    if (!original || !compressed) return;

    if (duration > 0 && currentTime >= duration - 0.1) {
      original.currentTime = 0;
      compressed.currentTime = 0;
      setCurrentTime(0);
    }

    const request = playbackRequest.current + 1;
    playbackRequest.current = request;

    void Promise.allSettled([original.play(), compressed.play()]).then((results) => {
      if (
        playbackRequest.current === request &&
        results.every((result) => result.status === 'rejected')
      ) {
        setPlaying(false);
      }
    });

    setPlaying(true);
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    if (originalRef.current) {
      originalRef.current.currentTime = nextTime;
    }
    if (compressedRef.current) {
      compressedRef.current.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
  };

  const handleTimeUpdate = () => {
    const original = originalRef.current;
    const compressed = compressedRef.current;
    if (!original || !compressed) return;

    setCurrentTime(original.currentTime);

    if (Math.abs(compressed.currentTime - original.currentTime) > 0.1) {
      compressed.currentTime = original.currentTime;
    }
  };

  const handleLoadedMetadata = () => {
    const candidates = [
      originalRef.current?.duration,
      compressedRef.current?.duration,
    ].filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value) && value > 0
    );

    if (candidates.length > 0) {
      setDuration(Math.min(...candidates));
    }
  };

  const handleEnded = () => {
    playbackRequest.current += 1;
    originalRef.current?.pause();
    compressedRef.current?.pause();
    setPlaying(false);

    if (duration > 0) {
      if (originalRef.current) {
        originalRef.current.currentTime = duration;
      }
      if (compressedRef.current) {
        compressedRef.current.currentTime = duration;
      }
      setCurrentTime(duration);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium">Original</span>
            <span className="mono text-xs text-mist-500 dark:text-mist-400">
              {formatBytes(originalSize)}
            </span>
          </div>
          <div className="relative mt-1.5 overflow-hidden rounded-lg bg-black">
            <video
              ref={originalRef}
              src={originalUrl}
              muted
              playsInline
              preload="metadata"
              onClick={togglePlayback}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              className="aspect-video w-full cursor-pointer object-contain"
              aria-label="Original video preview"
            />
            {!playing && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="ml-0.5 h-4 w-4" strokeWidth={1.5} />
                </span>
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium">Compressed</span>
            <span className="mono text-xs text-mist-500 dark:text-mist-400">
              {formatBytes(compressedSize)}
            </span>
          </div>
          <div className="relative mt-1.5 overflow-hidden rounded-lg bg-black">
            <video
              ref={compressedRef}
              src={compressedUrl}
              playsInline
              preload="metadata"
              onClick={togglePlayback}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              className="aspect-video w-full cursor-pointer object-contain"
              aria-label="Compressed video preview"
            />
            {!playing && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="ml-0.5 h-4 w-4" strokeWidth={1.5} />
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-lg border border-mist-200 bg-mist-50 px-3 py-2 dark:border-mist-800 dark:bg-mist-950/50">
        <button
          type="button"
          onClick={togglePlayback}
          disabled={duration <= 0}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-mist-900 transition-colors duration-150 ease-out hover:bg-mist-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-mist-800 dark:text-mist-50 dark:hover:bg-mist-700"
          aria-label={playing ? 'Pause both previews' : 'Play both previews'}
        >
          {playing ? (
            <Pause className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Play className="ml-0.5 h-4 w-4" strokeWidth={1.5} />
          )}
        </button>

        <span className="mono shrink-0 text-xs text-mist-500 dark:text-mist-400">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 0}
          step={0.1}
          value={duration > 0 ? Math.min(currentTime, duration) : 0}
          onChange={handleSeek}
          disabled={duration <= 0}
          aria-label="Seek both previews"
          className="w-full cursor-pointer accent-primary-700 disabled:cursor-not-allowed dark:accent-primary-400"
        />
      </div>

      <p className="mt-2 text-xs text-mist-500 dark:text-mist-400">
        One playhead controls both videos.
      </p>
    </div>
  );
}
