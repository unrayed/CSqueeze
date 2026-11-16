import { useEffect, useState } from 'react';
import * as Progress from '@radix-ui/react-progress';
import { X, Loader2 } from 'lucide-react';
import { cn, formatBitrate, formatDuration } from '../../lib/utils';
import { STAGE_LABELS } from '../../lib/constants';
import type { CompressionProgress as ProgressType, CompressionStage } from '../../types';

interface CompressionProgressProps {
  progress: ProgressType;
  onCancel: () => void;
}

const phases = [
  { label: 'Read', stage: 'reading' },
  { label: 'Tracks', stage: 'demuxing' },
  { label: 'Encode', stage: 'encoding' },
  { label: 'Write', stage: 'finalizing' },
] as const;

const frameFormatter = new Intl.NumberFormat('en-US');

export function CompressionProgress({ progress, onCancel }: CompressionProgressProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);

  useEffect(() => {
    const next = Number.isFinite(progress.progress)
      ? Math.min(100, Math.max(0, progress.progress))
      : 0;
    setDisplayedProgress((previous) => Math.max(previous, next));
  }, [progress.progress]);

  const stageLabel = STAGE_LABELS[progress.stage] ?? progress.stage;
  const phaseIndex = getPhaseIndex(progress.stage);
  const showPass = progress.pass > 0 && progress.passCount > 0;
  const hasOutput = progress.width > 0 && progress.height > 0;
  const elapsed = formatDuration(Math.max(0, progress.elapsedMs) / 1000);
  const eta =
    progress.etaMs !== null && progress.etaMs > 0
      ? formatEta(progress.etaMs)
      : null;
  const bitrate =
    progress.currentBitrate !== undefined && progress.currentBitrate > 0
      ? formatBitrate(progress.currentBitrate)
      : null;
  const frameCount =
    progress.totalFrames > 0
      ? `${frameFormatter.format(progress.processedFrames)} / ${frameFormatter.format(progress.totalFrames)} frames`
      : progress.processedFrames > 0
        ? `${frameFormatter.format(progress.processedFrames)} frames`
        : null;
  const showMessage =
    progress.message.trim() !== '' && progress.message.trim() !== stageLabel;

  return (
    <div className="rounded-xl border border-mist-200 bg-white p-5 dark:border-mist-800 dark:bg-mist-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Loader2
            className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary-700 dark:text-primary-300"
            strokeWidth={1.5}
          />
          <div>
            <span className="text-sm font-medium">{stageLabel}</span>
            {showMessage && (
              <p className="mt-0.5 text-xs leading-5 text-mist-500 dark:text-mist-400">
                {progress.message}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex h-8 items-center gap-1.5 self-start rounded-md px-2 text-xs text-mist-500 transition-colors duration-150 ease-out hover:bg-mist-100 hover:text-mist-700 dark:text-mist-400 dark:hover:bg-mist-800 dark:hover:text-mist-200"
          aria-label="Cancel compression"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          Cancel
        </button>
      </div>

      <div className="mt-5">
        <Progress.Root
          value={displayedProgress}
          className="relative h-1.5 overflow-hidden rounded-full bg-mist-200 dark:bg-mist-800"
        >
          <Progress.Indicator
            className="h-full rounded-full bg-primary-700 dark:bg-primary-400"
            style={{ width: `${displayedProgress}%` }}
          />
        </Progress.Root>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="mono text-sm text-mist-900 dark:text-mist-50">
          {Math.round(displayedProgress)}%
        </span>

        <div className="mono flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist-500 dark:text-mist-400">
          {showPass && (
            <span>
              Pass {progress.pass} / {progress.passCount}
            </span>
          )}
          <span>{elapsed} elapsed</span>
          {eta && <span>about {eta} left</span>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-mist-200 pt-4 dark:border-mist-800">
        {phases.map((phase, index) => {
          const isActive = index === phaseIndex;
          const isDone = phaseIndex >= 0 && index < phaseIndex;

          return (
            <div key={phase.stage} className="min-w-0">
              <div
                className={cn(
                  'h-0.5 w-full rounded-full',
                  isActive || isDone
                    ? 'bg-primary-600 dark:bg-primary-400'
                    : 'bg-mist-200 dark:bg-mist-800'
                )}
              />
              <div
                className={cn(
                  'mt-2 flex items-center gap-1.5 text-xs',
                  isActive
                    ? 'font-medium text-mist-900 dark:text-mist-50'
                    : 'text-mist-500 dark:text-mist-400'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    isActive || isDone
                      ? 'bg-primary-600 dark:bg-primary-400'
                      : 'bg-mist-300 dark:bg-mist-700'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{phase.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {(hasOutput || bitrate || frameCount) && (
        <div className="mono mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-mist-200 pt-3 text-xs text-mist-500 dark:border-mist-800 dark:text-mist-400">
          {hasOutput && (
            <span>
              Output {progress.width}×{progress.height}
            </span>
          )}
          {progress.fps > 0 && <span>{Math.round(progress.fps)} fps</span>}
          {bitrate && <span>{bitrate}</span>}
          {frameCount && <span>{frameCount}</span>}
        </div>
      )}

      <p className="mt-4 border-t border-mist-200 pt-3 text-xs text-mist-500 dark:border-mist-800 dark:text-mist-400">
        Runs on this device. Keep the tab open until it finishes.
      </p>
    </div>
  );
}

function getPhaseIndex(stage: CompressionStage): number {
  switch (stage) {
    case 'reading':
      return 0;
    case 'demuxing':
      return 1;
    case 'encoding':
      return 2;
    case 'finalizing':
      return 3;
    case 'complete':
      return phases.length;
    default:
      return -1;
  }
}

function formatEta(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (totalMinutes < 60) {
    return seconds > 0 ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
