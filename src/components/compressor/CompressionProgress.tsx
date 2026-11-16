import * as Progress from '@radix-ui/react-progress';
import { X, Loader2 } from 'lucide-react';
import { cn, formatBitrate } from '../../lib/utils';
import { STAGE_LABELS } from '../../lib/constants';
import type { CompressionProgress as ProgressType } from '../../types';

interface CompressionProgressProps {
  progress: ProgressType;
  onCancel: () => void;
}

export function CompressionProgress({ progress, onCancel }: CompressionProgressProps) {
  const stageLabel = STAGE_LABELS[progress.stage] ?? progress.stage;
  const isRetrying = progress.stage === 'retrying';

  return (
    <div className="rounded-xl border border-mist-200 bg-white p-5 dark:border-mist-800 dark:bg-mist-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Loader2
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 animate-spin',
              isRetrying
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-primary-700 dark:text-primary-300'
            )}
            strokeWidth={1.5}
          />
          <div>
            <span className="text-sm font-medium">{stageLabel}</span>
            {isRetrying && (
              <p className="mt-0.5 text-xs text-mist-500 dark:text-mist-400">
                Lowering the bitrate to fit the target
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="self-start rounded-md p-1 text-mist-500 transition-colors duration-150 ease-out hover:bg-mist-100 hover:text-mist-700 dark:hover:bg-mist-800 dark:hover:text-mist-200"
          aria-label="Cancel compression"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-5">
        <Progress.Root
          value={progress.progress}
          className="relative h-1.5 overflow-hidden rounded-full bg-mist-200 dark:bg-mist-800"
        >
          <Progress.Indicator
            className={cn(
              'h-full rounded-full',
              isRetrying ? 'bg-amber-500' : 'bg-primary-700 dark:bg-primary-400'
            )}
            style={{ width: `${progress.progress}%` }}
          />
        </Progress.Root>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="mono text-sm text-mist-900 dark:text-mist-50">
          {Math.round(progress.progress)}%
        </span>

        <div className="mono flex items-center gap-4 text-xs text-mist-500 dark:text-mist-400">
          {progress.maxAttempts > 1 && (
            <span>
              Pass {progress.currentAttempt} / {progress.maxAttempts}
            </span>
          )}
          {progress.currentBitrate && <span>{formatBitrate(progress.currentBitrate)}</span>}
        </div>
      </div>

      <p className="mt-4 border-t border-mist-200 pt-3 text-xs text-mist-500 dark:border-mist-800 dark:text-mist-400">
        Runs on this device. Keep the tab open until it finishes.
      </p>
    </div>
  );
}
