import * as Progress from '@radix-ui/react-progress';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatBitrate } from '../../lib/utils';
import { STAGE_LABELS } from '../../lib/constants';
import type { CompressionProgress as ProgressType } from '../../types';

interface CompressionProgressProps {
  progress: ProgressType;
  onCancel: () => void;
}

const stageEmojis: Record<string, string> = {
  idle: '😴',
  reading: '📖',
  analyzing: '🔍',
  encoding: '⚙️',
  retrying: '🔄',
  finalizing: '✨',
  complete: '🎉',
  error: '😅',
  cancelled: '🛑',
};

export function CompressionProgress({ progress, onCancel }: CompressionProgressProps) {
  const stageLabel = STAGE_LABELS[progress.stage] ?? progress.stage;
  const stageEmoji = stageEmojis[progress.stage] ?? '⚙️';
  const isRetrying = progress.stage === 'retrying';

  return (
    <div className="rounded-3xl border-2 border-primary-200 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-900/20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-gray-800">
            {stageEmoji}
          </div>
          <div>
            <span className="font-bold">{stageLabel}</span>
            {isRetrying && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Adjusting for better results...
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Cancel compression"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <Progress.Root
          value={progress.progress}
          className="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <Progress.Indicator
            className={cn(
              'h-full transition-all duration-500 ease-out',
              isRetrying
                ? 'bg-amber-500'
                : 'bg-primary-500'
            )}
            style={{ width: `${progress.progress}%` }}
          />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </Progress.Root>
      </div>

      {/* Details */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
          {Math.round(progress.progress)}%
        </span>
        
        <div className="flex items-center gap-3">
          {/* Attempt counter */}
          {progress.maxAttempts > 1 && (
            <span
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                isRetrying
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              Attempt {progress.currentAttempt}/{progress.maxAttempts}
            </span>
          )}

          {/* Current bitrate */}
          {progress.currentBitrate && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatBitrate(progress.currentBitrate)}
            </span>
          )}
        </div>
      </div>

      {/* Fun message */}
      <div className="mt-4 rounded-2xl bg-white/50 p-3 text-center text-sm text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
        {progress.progress < 30 && "Warming up the squeeze machine... 🍋"}
        {progress.progress >= 30 && progress.progress < 60 && "Crunching those pixels... 🔢"}
        {progress.progress >= 60 && progress.progress < 90 && "Almost there, looking good! ✨"}
        {progress.progress >= 90 && "Finishing touches... 🎨"}
      </div>
    </div>
  );
}
