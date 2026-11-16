import { useState } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Target } from 'lucide-react';
import { cn, formatBytes } from '../../lib/utils';
import { SIZE_PRESETS, FILE_LIMITS } from '../../lib/constants';
import type { VideoMetadata } from '../../types';

interface TargetSizePickerProps {
  targetSizeBytes: number;
  onChange: (bytes: number) => void;
  metadata: VideoMetadata;
}

export function TargetSizePicker({ targetSizeBytes, onChange, metadata }: TargetSizePickerProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const matchingPreset = SIZE_PRESETS.find((p) => p.bytes === targetSizeBytes);

  const handlePresetChange = (value: string) => {
    if (!value) return;

    if (value === 'custom') {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    const preset = SIZE_PRESETS.find((p) => p.label === value);
    if (preset) {
      onChange(preset.bytes);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomValue(value);

    const mb = parseFloat(value);
    if (!isNaN(mb) && mb >= 1 && mb <= 500) {
      onChange(Math.round(mb * 1024 * 1024));
    }
  };

  const estimatedBitrate = (targetSizeBytes * 8) / metadata.duration;
  const qualityHint = getQualityHint(estimatedBitrate, metadata.height);
  const targetShare = Math.min(100, (targetSizeBytes / metadata.fileSize) * 100);

  return (
    <div className="rounded-xl border border-mist-200 bg-white p-4 dark:border-mist-800 dark:bg-mist-900 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Target
            className="h-4 w-4 text-mist-500 dark:text-mist-400"
            strokeWidth={1.5}
          />
          Target size
        </span>
        <span className="mono text-xs text-mist-500 dark:text-mist-400">
          {formatBytes(targetSizeBytes)}
        </span>
      </div>

      <ToggleGroup.Root
        type="single"
        value={isCustom ? 'custom' : matchingPreset?.label ?? ''}
        onValueChange={handlePresetChange}
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5"
      >
        {SIZE_PRESETS.map((preset) => (
          <ToggleGroup.Item
            key={preset.label}
            value={preset.label}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out',
              targetSizeBytes === preset.bytes && !isCustom
                ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
                : 'border-mist-200 bg-white hover:border-mist-300 hover:bg-mist-50 dark:border-mist-700 dark:bg-mist-900 dark:hover:border-mist-600 dark:hover:bg-mist-800'
            )}
          >
            <div
              className={cn(
                'mono text-sm',
                targetSizeBytes === preset.bytes && !isCustom
                  ? 'text-primary-800 dark:text-primary-200'
                  : 'text-mist-900 dark:text-mist-100'
              )}
            >
              {preset.label}
            </div>
            <div className="mt-0.5 text-xs leading-4 text-mist-500 dark:text-mist-400">
              {preset.description}
            </div>
          </ToggleGroup.Item>
        ))}
        <ToggleGroup.Item
          value="custom"
          className={cn(
            'rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out',
            isCustom
              ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
              : 'border-mist-200 bg-white hover:border-mist-300 hover:bg-mist-50 dark:border-mist-700 dark:bg-mist-900 dark:hover:border-mist-600 dark:hover:bg-mist-800'
          )}
        >
          <div
            className={cn(
              'mono text-sm',
              isCustom
                ? 'text-primary-800 dark:text-primary-200'
                : 'text-mist-900 dark:text-mist-100'
            )}
          >
            Custom
          </div>
          <div className="mt-0.5 text-xs leading-4 text-mist-500 dark:text-mist-400">
            Any size
          </div>
        </ToggleGroup.Item>
      </ToggleGroup.Root>

      {isCustom && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={FILE_LIMITS.MIN_TARGET_SIZE / (1024 * 1024)}
            max={FILE_LIMITS.MAX_TARGET_SIZE / (1024 * 1024)}
            step="0.1"
            value={customValue}
            onChange={handleCustomChange}
            placeholder="Enter size"
            className="input w-32"
          />
          <span className="mono text-sm text-mist-500 dark:text-mist-400">MB</span>
        </div>
      )}

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-mist-500 dark:text-mist-400">
          <span>Target share of source</span>
          <span className="mono">{Math.round(targetShare)}%</span>
        </div>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-mist-200 dark:bg-mist-800">
          <div
            className="h-full rounded-full bg-primary-600 dark:bg-primary-400"
            style={{ width: `${targetShare}%` }}
          />
          <span
            className="absolute top-0 h-full w-px bg-primary-950 dark:bg-primary-100"
            style={{ left: `${targetShare}%` }}
          />
        </div>
        <div className="mono mt-1.5 flex justify-between text-xs text-mist-500 dark:text-mist-400">
          <span>{formatBytes(targetSizeBytes)} target</span>
          <span>{formatBytes(metadata.fileSize)} source</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-mist-200 bg-mist-50 px-3 py-2.5 dark:border-mist-800 dark:bg-mist-950/50">
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', qualityHint.dotColor)}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{qualityHint.label}</span>
          <span className="text-xs text-mist-500 dark:text-mist-400">
            {qualityHint.description}
          </span>
        </div>
      </div>
    </div>
  );
}

function getQualityHint(
  bitrate: number,
  height: number
): { label: string; description: string; dotColor: string } {
  const multiplier = height >= 1080 ? 1 : height >= 720 ? 0.6 : 0.4;

  const excellent = 8_000_000 * multiplier;
  const good = 4_000_000 * multiplier;
  const acceptable = 2_000_000 * multiplier;
  const low = 1_000_000 * multiplier;

  if (bitrate >= excellent) {
    return {
      label: 'Excellent quality',
      description: 'Minimal compression artifacts',
      dotColor: 'bg-primary-600 dark:bg-primary-400',
    };
  }
  if (bitrate >= good) {
    return {
      label: 'Good quality',
      description: 'Slight compression, looks clean',
      dotColor: 'bg-primary-600 dark:bg-primary-400',
    };
  }
  if (bitrate >= acceptable) {
    return {
      label: 'Acceptable quality',
      description: 'Noticeable compression but watchable',
      dotColor: 'bg-amber-500',
    };
  }
  if (bitrate >= low) {
    return {
      label: 'Low quality',
      description: 'Visible artifacts, try a lower resolution',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    label: 'Very low quality',
    description: 'Lower the resolution for a better result',
    dotColor: 'bg-red-500',
  };
}
