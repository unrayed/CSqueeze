import { useState } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '../../lib/utils';
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

  // Check if current value matches a preset
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

  // Calculate estimated quality hint
  const estimatedBitrate = (targetSizeBytes * 8) / metadata.duration;
  const qualityHint = getQualityHint(estimatedBitrate, metadata.height);

  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50 sm:p-5">
      <label className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span>🎯</span> Target Size
      </label>

      {/* Preset buttons */}
      <ToggleGroup.Root
        type="single"
        value={isCustom ? 'custom' : matchingPreset?.label ?? ''}
        onValueChange={handlePresetChange}
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {SIZE_PRESETS.map((preset) => (
          <ToggleGroup.Item
            key={preset.label}
            value={preset.label}
            className={cn(
              'rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-4',
              'border-2 hover:scale-105',
              targetSizeBytes === preset.bytes && !isCustom
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
            )}
          >
            <div className="text-lg">{preset.label}</div>
            <div className="text-xs font-normal text-gray-500">{preset.description}</div>
          </ToggleGroup.Item>
        ))}
        <ToggleGroup.Item
          value="custom"
          className={cn(
            'rounded-xl px-4 py-3 text-sm font-semibold transition-all',
            'border-2 hover:scale-105',
            isCustom
              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
          )}
        >
          <div className="text-lg">Custom</div>
          <div className="text-xs font-normal text-gray-500">Any size</div>
        </ToggleGroup.Item>
      </ToggleGroup.Root>

      {/* Custom input */}
      {isCustom && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            min={FILE_LIMITS.MIN_TARGET_SIZE / (1024 * 1024)}
            max={FILE_LIMITS.MAX_TARGET_SIZE / (1024 * 1024)}
            step="0.1"
            value={customValue}
            onChange={handleCustomChange}
            placeholder="Enter size"
            className="input w-full sm:w-32"
          />
          <span className="font-medium text-gray-600 dark:text-gray-400">MB</span>
        </div>
      )}

      {/* Quality hint */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-3 dark:bg-gray-800 sm:flex-row sm:items-center">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl text-xl',
            qualityHint.bgColor
          )}
        >
          {qualityHint.emoji}
        </div>
        <div>
          <div className="font-semibold">{qualityHint.label}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{qualityHint.description}</div>
        </div>
      </div>
    </div>
  );
}

function getQualityHint(
  bitrate: number,
  height: number
): { label: string; description: string; emoji: string; bgColor: string } {
  // Adjust thresholds based on resolution
  const multiplier = height >= 1080 ? 1 : height >= 720 ? 0.6 : 0.4;

  const excellent = 8_000_000 * multiplier;
  const good = 4_000_000 * multiplier;
  const acceptable = 2_000_000 * multiplier;
  const low = 1_000_000 * multiplier;

  if (bitrate >= excellent) {
    return {
      label: 'Excellent quality',
      description: 'Minimal compression artifacts',
      emoji: '🌟',
      bgColor: 'bg-primary-100 dark:bg-primary-900/50',
    };
  }
  if (bitrate >= good) {
    return {
      label: 'Good quality',
      description: 'Slight compression, looks great',
      emoji: '😊',
      bgColor: 'bg-primary-200 dark:bg-primary-900/40',
    };
  }
  if (bitrate >= acceptable) {
    return {
      label: 'Acceptable quality',
      description: 'Noticeable compression but watchable',
      emoji: '👍',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    };
  }
  if (bitrate >= low) {
    return {
      label: 'Low quality',
      description: 'Visible artifacts, consider enabling downscale',
      emoji: '😬',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    };
  }
  return {
    label: 'Very low quality',
    description: 'Enable downscale for better results!',
    emoji: '🥔',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
  };
}
