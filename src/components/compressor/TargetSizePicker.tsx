import { useState, type ChangeEvent } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Target, Info, AlertCircle } from 'lucide-react';
import { cn, formatBytes, formatBitrate } from '../../lib/utils';
import {
  SIZE_PRESETS,
  FILE_LIMITS,
  ENCODING,
  AUTO_RESOLUTION_CEILING,
} from '../../lib/constants';
import type {
  AudioKbps,
  QualityPreset,
  ResolutionCap,
  VideoMetadata,
} from '../../types';

interface TargetSizePickerProps {
  targetSizeBytes: number;
  onChange: (bytes: number) => void;
  metadata: VideoMetadata;
  preset: QualityPreset;
  resolution: ResolutionCap;
  audioKbps: AudioKbps;
  muteAudio: boolean;
}

const MB_IN_BYTES = 1024 * 1024;
const MIN_TARGET_MB = FILE_LIMITS.MIN_TARGET_SIZE / MB_IN_BYTES;
const MAX_TARGET_MB = FILE_LIMITS.MAX_TARGET_SIZE / MB_IN_BYTES;

export function TargetSizePicker({
  targetSizeBytes,
  onChange,
  metadata,
  preset,
  resolution,
  audioKbps,
  muteAudio,
}: TargetSizePickerProps) {
  const matchingPreset = SIZE_PRESETS.find((p) => p.bytes === targetSizeBytes);
  const [isCustom, setIsCustom] = useState(() => !matchingPreset);
  const [customValue, setCustomValue] = useState(() =>
    matchingPreset ? '' : formatCustomValue(targetSizeBytes)
  );

  const customError = isCustom ? validateCustomTarget(customValue) : null;
  const alreadyUnderTarget = targetSizeBytes >= metadata.fileSize;

  const handlePresetChange = (value: string) => {
    if (!value) return;

    if (value === 'custom') {
      setIsCustom(true);
      if (customValue.trim() === '') {
        setCustomValue(formatCustomValue(targetSizeBytes));
      }
      return;
    }

    setIsCustom(false);
    const presetOption = SIZE_PRESETS.find((p) => p.label === value);
    if (presetOption) {
      onChange(presetOption.bytes);
    }
  };

  const handleCustomChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomValue(value);

    const mb = Number(value);
    if (
      value.trim() !== '' &&
      Number.isFinite(mb) &&
      mb >= MIN_TARGET_MB &&
      mb <= MAX_TARGET_MB
    ) {
      onChange(Math.round(mb * MB_IN_BYTES));
    }
  };

  const targetShare =
    metadata.fileSize > 0
      ? Math.min(100, (targetSizeBytes / metadata.fileSize) * 100)
      : 0;

  const totalBitsPerSecond =
    metadata.duration > 0 ? (targetSizeBytes * 8) / metadata.duration : 0;
  const audioBitsPerSecond =
    metadata.hasAudio && !muteAudio
      ? audioKbps === 'auto'
        ? ENCODING.AUTO_AUDIO_MAX_BITRATE
        : audioKbps * 1000
      : 0;
  const overhead = totalBitsPerSecond * ENCODING.CONTAINER_OVERHEAD_RATIO;
  const videoBitsPerSecond = Math.max(
    0,
    totalBitsPerSecond - audioBitsPerSecond - overhead
  );
  const heightCap = getHeightCap(metadata, preset, resolution);
  const qualityHint = getQualityHint(videoBitsPerSecond, heightCap);

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
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
        aria-label="Target size"
      >
        {SIZE_PRESETS.map((presetOption) => {
          const isSelected = !isCustom && targetSizeBytes === presetOption.bytes;
          return (
            <ToggleGroup.Item
              key={presetOption.label}
              value={presetOption.label}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out',
                isSelected
                  ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
                  : 'border-mist-200 bg-white hover:border-mist-300 hover:bg-mist-50 dark:border-mist-700 dark:bg-mist-900 dark:hover:border-mist-600 dark:hover:bg-mist-800'
              )}
            >
              <div
                className={cn(
                  'mono text-sm',
                  isSelected
                    ? 'text-primary-800 dark:text-primary-200'
                    : 'text-mist-900 dark:text-mist-100'
                )}
              >
                {presetOption.label}
              </div>
              <div className="mt-0.5 text-xs leading-4 text-mist-500 dark:text-mist-400">
                {presetOption.description}
              </div>
            </ToggleGroup.Item>
          );
        })}
        <ToggleGroup.Item
          value="custom"
          className={cn(
            'col-span-2 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out sm:col-span-3',
            isCustom
              ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
              : 'border-mist-200 bg-white hover:border-mist-300 hover:bg-mist-50 dark:border-mist-700 dark:bg-mist-900 dark:hover:border-mist-600 dark:hover:bg-mist-800'
          )}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
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
            <div className="text-xs leading-4 text-mist-500 dark:text-mist-400">
              Anywhere from 1 to 500 MB
            </div>
          </div>
        </ToggleGroup.Item>
      </ToggleGroup.Root>

      {isCustom && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={MIN_TARGET_MB}
              max={MAX_TARGET_MB}
              step="0.1"
              value={customValue}
              onChange={handleCustomChange}
              placeholder="Enter size"
              aria-label="Custom target size in megabytes"
              aria-invalid={customError !== null}
              aria-describedby={customError ? 'custom-target-error' : undefined}
              className={cn(
                'input w-32',
                customError &&
                  'border-red-400 focus:border-red-500 focus:ring-red-500/25 dark:border-red-700 dark:focus:border-red-500'
              )}
            />
            <span className="mono text-sm text-mist-500 dark:text-mist-400">
              MB
            </span>
          </div>
          {customError && (
            <div
              id="custom-target-error"
              role="alert"
              className="mt-2 flex items-start gap-2 text-xs leading-5 text-red-700 dark:text-red-300"
            >
              <AlertCircle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                strokeWidth={1.5}
              />
              <span>
                {customError} Still using {formatBytes(targetSizeBytes)}.
              </span>
            </div>
          )}
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

      {alreadyUnderTarget ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-mist-200 bg-mist-50 px-3 py-2.5 dark:border-mist-800 dark:bg-mist-950/50">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-mist-500 dark:text-mist-400"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-sm font-medium">
              Already under target — no re-encode.
            </p>
            <p className="mt-0.5 text-xs leading-5 text-mist-500 dark:text-mist-400">
              The source is {formatBytes(metadata.fileSize)}. Keep the original
              below, or choose a target under that size to compress it.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-mist-200 bg-mist-50 px-3 py-2.5 dark:border-mist-800 dark:bg-mist-950/50">
          <div className="flex items-center gap-2.5">
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
          <span
            className="mono text-xs text-mist-500 dark:text-mist-400"
            title="Estimated video bitrate after audio and container overhead"
          >
            ~{formatBitrate(videoBitsPerSecond)} video
          </span>
        </div>
      )}
    </div>
  );
}

function formatCustomValue(bytes: number): string {
  return String(Number((bytes / MB_IN_BYTES).toFixed(1)));
}

function validateCustomTarget(value: string): string | null {
  if (value.trim() === '') {
    return `Enter a target between ${MIN_TARGET_MB} and ${MAX_TARGET_MB} MB.`;
  }

  const mb = Number(value);
  if (!Number.isFinite(mb)) {
    return `Enter a number between ${MIN_TARGET_MB} and ${MAX_TARGET_MB}.`;
  }
  if (mb < MIN_TARGET_MB) {
    return `Targets must be at least ${MIN_TARGET_MB} MB.`;
  }
  if (mb > MAX_TARGET_MB) {
    return `Targets can be at most ${MAX_TARGET_MB} MB.`;
  }
  return null;
}

function getHeightCap(
  metadata: VideoMetadata,
  preset: QualityPreset,
  resolution: ResolutionCap
): number {
  if (resolution === 'source') {
    return metadata.height;
  }
  if (resolution === 'auto') {
    if (preset === 'fast') {
      return metadata.height;
    }
    return Math.min(metadata.height, AUTO_RESOLUTION_CEILING);
  }
  return Math.min(metadata.height, resolution);
}

function getQualityHint(
  bitrate: number,
  height: number
): { label: string; description: string; dotColor: string } {
  if (bitrate <= 0) {
    return {
      label: 'Target is mostly audio',
      description: 'Raise the target, lower the audio, or mute it.',
      dotColor: 'bg-red-500',
    };
  }

  const multiplier =
    height >= 2160 ? 2.2 : height >= 1440 ? 1.5 : height >= 1080 ? 1 : height >= 720 ? 0.6 : 0.4;

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
    description: 'Raise the target or lower the resolution',
    dotColor: 'bg-red-500',
  };
}
