import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import {
  ArrowLeftRight,
  Columns2,
  GripVertical,
  Maximize2,
  Pause,
  Play,
  SplitSquareHorizontal,
  StepBack,
  StepForward,
  X,
  ZoomIn,
} from 'lucide-react';
import { cn, formatBytes, formatDuration } from '../../lib/utils';

interface PreviewCompareProps {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
}

type CompareMode = 'side' | 'wipe' | 'ab';
type ZoomMode = 'fit' | 'actual';
type ABSide = 'original' | 'compressed';

const FRAME_STEP_SECONDS = 1 / 30;
const DIVIDER_KEY_STEP = 2;
const SIDE_BY_SIDE_MIN_WIDTH = 800;
const INLINE_MAX_HEIGHT_VH = 65;
const EXPANDED_CHROME_REM = 17;

const MODE_OPTIONS: Array<{
  value: CompareMode;
  label: string;
  title: string;
  icon: typeof Columns2;
}> = [
  {
    value: 'side',
    label: 'Side by side',
    title: 'Show the original and compressed frames next to each other',
    icon: Columns2,
  },
  {
    value: 'wipe',
    label: 'Wipe',
    title: 'Drag a divider across one stage to reveal the compressed frame',
    icon: SplitSquareHorizontal,
  },
  {
    value: 'ab',
    label: 'A/B',
    title: 'Switch one stage between the original and compressed frames',
    icon: ArrowLeftRight,
  },
];

export function PreviewCompare({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
}: PreviewCompareProps) {
  const originalRef = useRef<HTMLVideoElement>(null);
  const compressedRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const playbackRequest = useRef(0);
  const playingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const panDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    maxX: number;
    maxY: number;
  } | null>(null);
  const dividerPointerRef = useRef<number | null>(null);

  const [mode, setMode] = useState<CompareMode>('side');
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  const [abSide, setAbSide] = useState<ABSide>('compressed');
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [divider, setDivider] = useState(50);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingPan, setDraggingPan] = useState(false);
  const [draggingDivider, setDraggingDivider] = useState(false);
  const [stageWidth, setStageWidth] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth
  );

  const setPlaybackState = (next: boolean) => {
    playingRef.current = next;
    setPlaying(next);
  };

  const setTimeState = (next: number) => {
    currentTimeRef.current = next;
    setCurrentTime(next);
  };

  const setDurationState = (next: number) => {
    durationRef.current = next;
    setDuration(next);
  };

  useEffect(() => {
    playbackRequest.current += 1;
    originalRef.current?.pause();
    compressedRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setTimeState(0);
    setDurationState(0);
    setAspectRatio(16 / 9);
    setNaturalSize(null);
    setDivider(50);
    setPan({ x: 0, y: 0 });
  }, [originalUrl, compressedUrl]);

  useEffect(() => {
    return () => {
      playbackRequest.current += 1;
      originalRef.current?.pause();
      compressedRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => setStageWidth(node.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded]);

  useEffect(() => {
    const original = originalRef.current;
    const compressed = compressedRef.current;
    if (!original || !compressed) return;

    let cancelled = false;
    let remaining = 2;
    const listeners: Array<() => void> = [];

    const applyState = () => {
      if (cancelled) return;

      const end = durationRef.current;
      const target = end > 0
        ? Math.min(currentTimeRef.current, Math.max(0, end - 0.001))
        : Math.max(0, currentTimeRef.current);

      try {
        original.currentTime = target;
        compressed.currentTime = target;
      } catch {
        // Metadata can still be settling; the next update retries.
      }

      if (playingRef.current) {
        const request = playbackRequest.current + 1;
        playbackRequest.current = request;
        void Promise.allSettled([original.play(), compressed.play()]).then(
          (results) => {
            if (
              playbackRequest.current === request &&
              results.every((result) => result.status === 'rejected')
            ) {
              setPlaybackState(false);
            }
          }
        );
      }
    };

    const onReady = () => {
      remaining -= 1;
      if (remaining === 0) applyState();
    };

    for (const video of [original, compressed]) {
      if (video.readyState >= 1) {
        onReady();
      } else {
        video.addEventListener('loadedmetadata', onReady, { once: true });
        listeners.push(() =>
          video.removeEventListener('loadedmetadata', onReady)
        );
      }
    }

    return () => {
      cancelled = true;
      listeners.forEach((remove) => remove());
    };
  }, [expanded, originalUrl, compressedUrl]);

  const pauseBoth = () => {
    playbackRequest.current += 1;
    originalRef.current?.pause();
    compressedRef.current?.pause();
    setPlaybackState(false);
  };

  const seekTo = (nextTime: number) => {
    const end = durationRef.current;
    const clamped = Math.min(
      Math.max(0, nextTime),
      end > 0 ? end : Math.max(0, nextTime)
    );

    try {
      if (originalRef.current) originalRef.current.currentTime = clamped;
      if (compressedRef.current) compressedRef.current.currentTime = clamped;
    } catch {
      // Seeking before metadata is ready is ignored.
    }

    setTimeState(clamped);
  };

  const togglePlayback = () => {
    if (playingRef.current) {
      pauseBoth();
      return;
    }

    const original = originalRef.current;
    const compressed = compressedRef.current;
    if (!original || !compressed) return;

    const end = durationRef.current;
    if (end > 0 && currentTimeRef.current >= end - 0.1) {
      seekTo(0);
    }

    const request = playbackRequest.current + 1;
    playbackRequest.current = request;
    setPlaybackState(true);

    void Promise.allSettled([original.play(), compressed.play()]).then(
      (results) => {
        if (
          playbackRequest.current === request &&
          results.every((result) => result.status === 'rejected')
        ) {
          setPlaybackState(false);
        }
      }
    );
  };

  const stepFrame = (direction: -1 | 1) => {
    const baseTime =
      originalRef.current?.currentTime ?? currentTimeRef.current;
    pauseBoth();
    seekTo(baseTime + direction * FRAME_STEP_SECONDS);
  };

  const handlePlaybackSeek = (event: ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(event.target.value));
  };

  const handleTimeUpdate = () => {
    const original = originalRef.current;
    const compressed = compressedRef.current;
    if (!original || !compressed || !Number.isFinite(original.currentTime)) {
      return;
    }

    setTimeState(original.currentTime);

    if (Math.abs(compressed.currentTime - original.currentTime) > 0.1) {
      try {
        compressed.currentTime = original.currentTime;
      } catch {
        // The compressed frame can seek a little later; retry on next tick.
      }
    }
  };

  const handleLoadedMetadata = () => {
    const original = originalRef.current;
    const compressed = compressedRef.current;
    const candidates = [original?.duration, compressed?.duration].filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value) && value > 0
    );

    if (candidates.length > 0) {
      setDurationState(Math.min(...candidates));
    }

    const width = original?.videoWidth || compressed?.videoWidth || 0;
    const height = original?.videoHeight || compressed?.videoHeight || 0;

    if (width > 0 && height > 0) {
      setAspectRatio(width / height);
      setNaturalSize({ width, height });
    }
  };

  const handleEnded = () => {
    playbackRequest.current += 1;
    originalRef.current?.pause();
    compressedRef.current?.pause();
    setPlaybackState(false);

    if (durationRef.current > 0) {
      seekTo(durationRef.current);
    }
  };

  const updateDividerFromClientX = (
    clientX: number,
    stage: HTMLElement | null
  ) => {
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0) return;

    const next = ((clientX - rect.left) / rect.width) * 100;
    setDivider(Math.min(100, Math.max(0, next)));
  };

  const handleDividerPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dividerPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingDivider(true);
    updateDividerFromClientX(event.clientX, event.currentTarget.parentElement);
  };

  const handleDividerPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (dividerPointerRef.current !== event.pointerId) return;
    updateDividerFromClientX(event.clientX, event.currentTarget.parentElement);
  };

  const endDividerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dividerPointerRef.current !== event.pointerId) return;
    dividerPointerRef.current = null;
    setDraggingDivider(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleDividerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next = divider;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = divider - DIVIDER_KEY_STEP;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = divider + DIVIDER_KEY_STEP;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 100;
        break;
      default:
        return;
    }

    event.preventDefault();
    setDivider(Math.min(100, Math.max(0, next)));
  };

  const handleStagePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (zoom !== 'actual' || event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button, [role="radio"], [data-compare-divider], [data-compare-controls]'
      )
    ) {
      return;
    }

    const stage = event.currentTarget;
    event.preventDefault();
    stage.setPointerCapture(event.pointerId);

    const rect = stage.getBoundingClientRect();
    const paneRect = compressedRef.current?.parentElement?.getBoundingClientRect();
    const paneWidth = paneRect?.width ?? rect.width;
    const paneHeight = paneRect?.height ?? rect.height;
    const maxX = naturalSize
      ? Math.max(0, (naturalSize.width - paneWidth) / 2)
      : 0;
    const maxY = naturalSize
      ? Math.max(0, (naturalSize.height - paneHeight) / 2)
      : 0;

    panDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
      maxX,
      maxY,
    };
    setDraggingPan(true);
  };

  const handleStagePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    setPan({
      x: Math.min(drag.maxX, Math.max(-drag.maxX, drag.originX + deltaX)),
      y: Math.min(drag.maxY, Math.max(-drag.maxY, drag.originY + deltaY)),
    });
  };

  const endStageDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    panDragRef.current = null;
    setDraggingPan(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleModeChange = (value: string) => {
    if (!value) return;
    setMode(value as CompareMode);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomChange = (value: string) => {
    if (!value) return;
    setZoom(value as ZoomMode);
    setPan({ x: 0, y: 0 });
  };

  const renderVideo = (side: ABSide) => {
    const isOriginal = side === 'original';

    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <video
          ref={isOriginal ? originalRef : compressedRef}
          src={isOriginal ? originalUrl : compressedUrl}
          muted={isOriginal}
          playsInline
          preload="auto"
          onTimeUpdate={isOriginal ? handleTimeUpdate : undefined}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          className={cn(
            zoom === 'fit'
              ? 'h-full w-full object-contain'
              : 'h-auto w-auto max-h-none max-w-none',
            draggingPan && 'cursor-grabbing'
          )}
          style={
            zoom === 'actual'
              ? { transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }
              : undefined
          }
          aria-label={
            isOriginal ? 'Original video preview' : 'Compressed video preview'
          }
        />
      </div>
    );
  };

  const stageLabel = (side: ABSide, className: string): ReactNode => (
    <span
      className={cn(
        'pointer-events-none absolute z-30 inline-flex items-center gap-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] leading-4 text-white sm:px-2 sm:py-1 sm:text-xs',
        className
      )}
    >
      <span className="font-medium">
        {side === 'original' ? 'Original' : 'Compressed'}
      </span>
      <span className="mono hidden text-[11px] text-white/70 sm:inline">
        {formatBytes(side === 'original' ? originalSize : compressedSize)}
      </span>
    </span>
  );

  const modeToggle = (
    <ToggleGroup.Root
      type="single"
      value={mode}
      onValueChange={handleModeChange}
      className="flex w-full items-center gap-1 rounded-lg border border-mist-200 bg-mist-100/60 p-1 dark:border-mist-800 dark:bg-mist-950/60 sm:w-auto"
      aria-label="Compare mode"
    >
      {MODE_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            title={option.title}
            className={cn(
              'inline-flex h-7 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs transition-colors duration-150 ease-out sm:flex-none',
              mode === option.value
                ? 'bg-white font-medium text-mist-900 dark:bg-mist-800 dark:text-mist-50'
                : 'text-mist-600 hover:text-mist-900 dark:text-mist-400 dark:hover:text-mist-100'
            )}
          >
            <Icon className="hidden h-3.5 w-3.5 sm:block" strokeWidth={1.5} />
            {option.label}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );

  const zoomToggle = (
    <ToggleGroup.Root
      type="single"
      value={zoom}
      onValueChange={handleZoomChange}
      className="flex items-center gap-1 rounded-lg border border-mist-200 bg-mist-100/60 p-1 dark:border-mist-800 dark:bg-mist-950/60"
      aria-label="Zoom"
    >
      <ToggleGroup.Item
        value="fit"
        title="Fit the whole frame inside the stage"
        className={cn(
          'inline-flex h-7 items-center justify-center rounded-md px-2 text-xs transition-colors duration-150 ease-out',
          zoom === 'fit'
            ? 'bg-white font-medium text-mist-900 dark:bg-mist-800 dark:text-mist-50'
            : 'text-mist-600 hover:text-mist-900 dark:text-mist-400 dark:hover:text-mist-100'
        )}
      >
        Fit
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="actual"
        title="Show pixels at 100% and drag to pan"
        className={cn(
          'inline-flex h-7 items-center justify-center gap-1 rounded-md px-2 text-xs transition-colors duration-150 ease-out',
          zoom === 'actual'
            ? 'bg-white font-medium text-mist-900 dark:bg-mist-800 dark:text-mist-50'
            : 'text-mist-600 hover:text-mist-900 dark:text-mist-400 dark:hover:text-mist-100'
        )}
      >
        <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.5} />
        100%
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );

  const sideToggle =
    mode === 'ab' ? (
      <div data-compare-controls className="absolute right-2 top-2 z-40">
        <ToggleGroup.Root
          type="single"
          value={abSide}
          onValueChange={(value) => {
            if (value) setAbSide(value as ABSide);
          }}
          className="flex items-center gap-1 rounded-lg border border-mist-200 bg-mist-50/95 p-1 shadow-[0_2px_10px_rgba(11,18,16,0.18)] dark:border-mist-700 dark:bg-mist-900/95"
          aria-label="A/B side"
        >
          <ToggleGroup.Item
            value="original"
            className={cn(
              'inline-flex h-7 items-center justify-center rounded-md px-2.5 text-xs transition-colors duration-150 ease-out',
              abSide === 'original'
                ? 'bg-white font-medium text-mist-900 dark:bg-mist-800 dark:text-mist-50'
                : 'text-mist-600 hover:text-mist-900 dark:text-mist-400 dark:hover:text-mist-100'
            )}
          >
            Original
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="compressed"
            className={cn(
              'inline-flex h-7 items-center justify-center rounded-md px-2.5 text-xs transition-colors duration-150 ease-out',
              abSide === 'compressed'
                ? 'bg-white font-medium text-mist-900 dark:bg-mist-800 dark:text-mist-50'
                : 'text-mist-600 hover:text-mist-900 dark:text-mist-400 dark:hover:text-mist-100'
            )}
          >
            Compressed
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    ) : null;

  const insetMode = mode !== 'side';
  const sideColumns =
    mode === 'side' &&
    (stageWidth >= SIDE_BY_SIDE_MIN_WIDTH || aspectRatio < 1);
  const stageAspect =
    mode === 'side'
      ? sideColumns
        ? aspectRatio * 2
        : aspectRatio / 2
      : aspectRatio;
  const inlineMaxHeight = INLINE_MAX_HEIGHT_VH * stageAspect;
  const expandedMaxHeight = `min(75vh, calc(100dvh - ${EXPANDED_CHROME_REM}rem))`;

  const stage = (
    <div
      ref={stageRef}
      data-testid="compare-stage"
      role="group"
      aria-label="Video comparison stage"
      onPointerDown={handleStagePointerDown}
      onPointerMove={handleStagePointerMove}
      onPointerUp={endStageDrag}
      onPointerCancel={endStageDrag}
      className={cn(
        'relative mx-auto w-full touch-pan-y overflow-hidden bg-black',
        expanded ? 'rounded-xl' : 'rounded-none sm:rounded-xl',
        zoom === 'actual' && 'cursor-grab touch-none',
        draggingPan && 'cursor-grabbing'
      )}
      style={
        expanded
          ? {
              aspectRatio: String(stageAspect),
              maxHeight: expandedMaxHeight,
              maxWidth: `min(100%, calc(${expandedMaxHeight} * ${stageAspect}))`,
            }
          : {
              aspectRatio: String(stageAspect),
              maxWidth: `min(100%, ${inlineMaxHeight.toFixed(2)}vh)`,
            }
      }
    >
      <div
        className={cn(
          insetMode
            ? 'absolute inset-0'
            : cn(
                'grid h-full w-full gap-px bg-mist-800',
                sideColumns
                  ? 'grid-cols-2 grid-rows-1'
                  : 'grid-cols-1 grid-rows-2'
              )
        )}
      >
        <div
          className={cn(
            'bg-black',
            mode === 'side'
              ? 'relative h-full min-h-0 overflow-hidden'
              : cn(
                  'absolute inset-0 overflow-hidden',
                  mode === 'ab' &&
                    'transition-opacity duration-150 ease-out',
                  mode === 'ab' &&
                    abSide !== 'original' &&
                    'pointer-events-none opacity-0'
                )
          )}
          aria-hidden={mode === 'ab' && abSide !== 'original'}
        >
          {renderVideo('original')}
          {mode === 'side' && stageLabel('original', 'left-2 top-2')}
        </div>

        <div
          className={cn(
            'bg-black',
            mode === 'side'
              ? 'relative h-full min-h-0 overflow-hidden'
              : cn(
                  'absolute inset-0 overflow-hidden',
                  mode === 'wipe' && 'z-10',
                  mode === 'ab' &&
                    'transition-opacity duration-150 ease-out',
                  mode === 'ab' &&
                    abSide !== 'compressed' &&
                    'pointer-events-none opacity-0'
                )
          )}
          style={
            mode === 'wipe'
              ? { clipPath: `inset(0 0 0 ${divider}%)` }
              : undefined
          }
          aria-hidden={mode === 'ab' && abSide !== 'compressed'}
        >
          {renderVideo('compressed')}
          {mode === 'side' && stageLabel('compressed', 'left-2 top-2')}
        </div>
      </div>

      {mode === 'wipe' && (
        <>
          {stageLabel('original', 'left-2 top-2')}
          {stageLabel('compressed', 'right-2 top-2')}
          <div
            data-compare-divider
            data-testid="compare-divider"
            role="slider"
            tabIndex={0}
            aria-label="Comparison divider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(divider)}
            aria-valuetext={`${Math.round(divider)}% from the left`}
            onPointerDown={handleDividerPointerDown}
            onPointerMove={handleDividerPointerMove}
            onPointerUp={endDividerDrag}
            onPointerCancel={endDividerDrag}
            onKeyDown={handleDividerKeyDown}
            className="absolute inset-y-0 z-20 w-10 -translate-x-1/2 touch-none cursor-ew-resize"
            style={{ left: `${divider}%` }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/70"
            />
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-1/2 top-1/2 flex h-9 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-white transition-colors duration-150 ease-out',
                draggingDivider
                  ? 'border-white bg-mist-950'
                  : 'border-white/60 bg-mist-950/70 hover:bg-mist-950'
              )}
            >
              <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
          </div>
        </>
      )}

      {mode === 'ab' && stageLabel(abSide, 'left-2 top-2')}
      {mode === 'ab' && sideToggle}
    </div>
  );

  const transport = (dark: boolean) => (
    <div
      data-testid="compare-transport"
      className={cn(
        'mt-3 flex flex-col gap-2 rounded-lg border p-2.5 sm:flex-row sm:items-center sm:gap-3',
        dark
          ? 'border-mist-800 bg-mist-900 text-mist-50'
          : 'border-mist-200 bg-mist-50 dark:border-mist-800 dark:bg-mist-950/50'
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => stepFrame(-1)}
          disabled={duration <= 0}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50',
            dark
              ? 'border-mist-700 bg-mist-900 text-mist-100 hover:bg-mist-800'
              : 'border-mist-200 bg-white text-mist-900 hover:bg-mist-100 dark:border-mist-800 dark:bg-mist-900 dark:text-mist-50 dark:hover:bg-mist-800'
          )}
          aria-label="Step back one frame"
          title="Back 1 frame (1/30 s)"
        >
          <StepBack className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={togglePlayback}
          disabled={duration <= 0}
          data-testid="compare-play"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50',
            dark
              ? 'border-mist-700 bg-mist-100 text-mist-950 hover:bg-white'
              : 'border-mist-300 bg-primary-700 text-white hover:bg-primary-800 dark:border-mist-700 dark:bg-mist-100 dark:text-mist-950 dark:hover:bg-white'
          )}
          aria-label={playing ? 'Pause both previews' : 'Play both previews'}
        >
          {playing ? (
            <Pause className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Play className="ml-0.5 h-4 w-4" strokeWidth={1.5} />
          )}
        </button>

        <button
          type="button"
          onClick={() => stepFrame(1)}
          disabled={duration <= 0}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50',
            dark
              ? 'border-mist-700 bg-mist-900 text-mist-100 hover:bg-mist-800'
              : 'border-mist-200 bg-white text-mist-900 hover:bg-mist-100 dark:border-mist-800 dark:bg-mist-900 dark:text-mist-50 dark:hover:bg-mist-800'
          )}
          aria-label="Step forward one frame"
          title="Forward 1 frame (1/30 s)"
        >
          <StepForward className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <span
          data-testid="compare-time"
          className={cn(
            'mono ml-1 shrink-0 text-xs',
            dark ? 'text-mist-300' : 'text-mist-500 dark:text-mist-400'
          )}
        >
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={duration > 0 ? duration : 0}
        step={0.01}
        value={duration > 0 ? Math.min(currentTime, duration) : 0}
        onChange={handlePlaybackSeek}
        disabled={duration <= 0}
        data-testid="compare-seek"
        aria-label="Seek both previews"
        aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(
          duration
        )}`}
        className={cn(
          'min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed',
          dark
            ? 'accent-primary-400'
            : 'accent-primary-700 dark:accent-primary-400'
        )}
      />
    </div>
  );

  const hint = [
    zoom === 'actual'
      ? 'Actual pixels at 100%. Drag the frame to pan.'
      : null,
    mode === 'wipe'
      ? 'Drag the divider or use the arrow keys.'
      : mode === 'ab'
        ? 'Switch sides without moving the playhead.'
        : 'One playhead drives both previews.',
  ]
    .filter(Boolean)
    .join(' ');

  const toolbar = (isExpanded: boolean) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {modeToggle}
      <div className="flex items-center gap-2 sm:ml-auto">
        <span className="text-xs text-mist-500 dark:text-mist-400 sm:hidden">
          View
        </span>
        {zoomToggle}
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-mist-200 bg-white px-2.5 text-xs font-medium text-mist-900 transition-colors duration-150 ease-out hover:bg-mist-100 dark:border-mist-800 dark:bg-mist-900 dark:text-mist-50 dark:hover:bg-mist-800 sm:ml-0"
            aria-label="Expand comparison"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Expand</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div data-testid="compare">
      {!expanded && (
        <div>
          <div className="flex flex-wrap items-center gap-2">{toolbar(false)}</div>
          <div className="mt-2.5 -mx-5 sm:mx-0">{stage}</div>
          {transport(false)}
          <p className="mt-2 text-xs text-mist-500 dark:text-mist-400">
            {hint}
          </p>
        </div>
      )}

      <Dialog.Root open={expanded} onOpenChange={setExpanded}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-mist-950/80" />
          <Dialog.Content
            aria-describedby={undefined}
            data-testid="compare-dialog"
            className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-mist-950 p-3 text-mist-50 focus:outline-none sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-sm font-medium">
                  Compare original and compressed
                </Dialog.Title>
                <p className="mono mt-0.5 text-xs text-mist-400">
                  {formatBytes(originalSize)} original ·{' '}
                  {formatBytes(compressedSize)} compressed
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-mist-700 bg-mist-900 px-2 text-xs font-medium text-mist-100 transition-colors duration-150 ease-out hover:bg-mist-800"
                  aria-label="Close expanded compare"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-3">{toolbar(true)}</div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center">
              {stage}
              <div className="mt-3 w-full">
                {transport(true)}
                <p className="mt-2 text-xs text-mist-400">{hint}</p>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
