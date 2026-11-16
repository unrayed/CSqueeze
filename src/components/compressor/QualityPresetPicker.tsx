import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Gauge } from 'lucide-react';
import { cn } from '../../lib/utils';
import { QUALITY_PRESET_OPTIONS } from '../../lib/constants';
import type { QualityPreset } from '../../types';

interface QualityPresetPickerProps {
  preset: QualityPreset;
  onChange: (preset: QualityPreset) => void;
}

export function QualityPresetPicker({ preset, onChange }: QualityPresetPickerProps) {
  const selected = QUALITY_PRESET_OPTIONS.find((option) => option.value === preset);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-0.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Gauge className="h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
          Quality preset
        </span>
        <span className="mono text-xs text-mist-500 dark:text-mist-400">
          {selected?.label ?? 'Balanced'}
        </span>
      </div>

      <ToggleGroup.Root
        type="single"
        value={preset}
        onValueChange={(value) => {
          if (value) onChange(value as QualityPreset);
        }}
        className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-mist-200 bg-mist-100/60 p-1 dark:border-mist-800 dark:bg-mist-900/60"
        aria-label="Quality preset"
      >
        {QUALITY_PRESET_OPTIONS.map((option) => (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            className={cn(
              'rounded-md px-2 py-1.5 text-sm transition-colors duration-150 ease-out',
              preset === option.value
                ? 'bg-white font-medium text-mist-900 dark:bg-mist-800 dark:text-mist-50'
                : 'text-mist-500 hover:text-mist-800 dark:text-mist-400 dark:hover:text-mist-100'
            )}
          >
            {option.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <p className="mt-1.5 px-0.5 text-xs leading-5 text-mist-500 dark:text-mist-400">
        {selected?.description}
      </p>
    </div>
  );
}
