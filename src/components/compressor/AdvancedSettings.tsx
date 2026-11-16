import * as Accordion from '@radix-ui/react-accordion';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import {
  ChevronDown,
  Check,
  Settings2,
  Scaling,
  Gauge,
  Volume2,
  VolumeX,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  AUDIO_OPTIONS,
  FPS_OPTIONS,
  RESOLUTION_OPTIONS,
} from '../../lib/constants';
import type {
  AudioKbps,
  FpsCap,
  ResolutionCap,
  SelectOption,
  VideoMetadata,
} from '../../types';

interface AdvancedSettingsProps {
  resolution: ResolutionCap;
  onResolutionChange: (value: ResolutionCap) => void;
  fps: FpsCap;
  onFpsChange: (value: FpsCap) => void;
  audioKbps: AudioKbps;
  onAudioKbpsChange: (value: AudioKbps) => void;
  muteAudio: boolean;
  onMuteAudioChange: (value: boolean) => void;
  hasAudio: boolean;
  metadata: VideoMetadata;
}

export function AdvancedSettings({
  resolution,
  onResolutionChange,
  fps,
  onFpsChange,
  audioKbps,
  onAudioKbpsChange,
  muteAudio,
  onMuteAudioChange,
  hasAudio,
  metadata,
}: AdvancedSettingsProps) {
  const availableResolutions = RESOLUTION_OPTIONS.filter(
    (option) => typeof option.value !== 'number' || option.value <= metadata.height
  );

  const audioMeta =
    metadata.hasAudio && metadata.audioChannels !== null && metadata.audioSampleRate !== null
      ? `${metadata.audioChannels} ch · ${Math.round(metadata.audioSampleRate / 1000)} kHz`
      : undefined;

  return (
    <Accordion.Root type="single" collapsible>
      <Accordion.Item
        value="advanced"
        className="overflow-hidden rounded-xl border border-mist-200 bg-white dark:border-mist-800 dark:bg-mist-900"
      >
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-mist-50 dark:hover:bg-mist-800/50">
            <div className="flex items-center gap-2.5">
              <Settings2
                className="h-4 w-4 text-mist-500 dark:text-mist-400"
                strokeWidth={1.5}
              />
              <span className="text-sm font-medium">Advanced settings</span>
              <span className="hidden text-xs text-mist-500 dark:text-mist-400 sm:inline">
                Resolution, frame rate, audio
              </span>
            </div>
            <ChevronDown
              className="h-4 w-4 text-mist-500 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 dark:text-mist-400"
              strokeWidth={1.5}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="space-y-5 border-t border-mist-200 px-4 py-4 dark:border-mist-800">
            <QuietSelect
              label="Resolution"
              icon={Scaling}
              value={resolution}
              options={availableResolutions}
              toValue={resolutionToValue}
              fromValue={resolutionFromValue}
              onChange={onResolutionChange}
              meta={`Source ${metadata.width}×${metadata.height}`}
            />

            <QuietSelect
              label="Frame rate"
              icon={Gauge}
              value={fps}
              options={FPS_OPTIONS}
              toValue={fpsToValue}
              fromValue={fpsFromValue}
              onChange={onFpsChange}
              meta={`Source ${Math.round(metadata.fps)} fps`}
            />

            {hasAudio && !muteAudio && (
              <QuietSelect
                label="Audio"
                icon={Volume2}
                value={audioKbps}
                options={AUDIO_OPTIONS}
                toValue={audioToValue}
                fromValue={audioFromValue}
                onChange={onAudioKbpsChange}
                meta={audioMeta}
              />
            )}

            {hasAudio && (
              <SettingToggle
                icon={VolumeX}
                label="Mute audio"
                description="Drop the audio track to leave more room for video"
                checked={muteAudio}
                onCheckedChange={onMuteAudioChange}
              />
            )}

            <p className="flex items-start gap-2 rounded-lg border border-mist-200 bg-mist-50 p-3 text-xs leading-5 text-mist-600 dark:border-mist-800 dark:bg-mist-950/50 dark:text-mist-300">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>
                Lower resolution and frame rate caps leave more of the target
                for image quality. Auto follows the selected preset.
              </span>
            </p>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

interface QuietSelectProps<T extends string | number> {
  label: string;
  icon: LucideIcon;
  value: T;
  options: SelectOption<T>[];
  toValue: (value: T) => string;
  fromValue: (value: string) => T;
  onChange: (value: T) => void;
  meta?: string | undefined;
}

function QuietSelect<T extends string | number>({
  label,
  icon: Icon,
  value,
  options,
  toValue,
  fromValue,
  onChange,
  meta,
}: QuietSelectProps<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <div>
      <span className="label flex items-center gap-2">
        <Icon
          className="h-4 w-4 text-mist-500 dark:text-mist-400"
          strokeWidth={1.5}
        />
        {label}
      </span>
      <Select.Root
        value={toValue(value)}
        onValueChange={(nextValue) => onChange(fromValue(nextValue))}
      >
        <Select.Trigger
          aria-label={label}
          className="input flex items-center justify-between"
        >
          <Select.Value>{selected?.label ?? ''}</Select.Value>
          <Select.Icon>
            <ChevronDown
              className="h-4 w-4 text-mist-500 dark:text-mist-400"
              strokeWidth={1.5}
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 min-w-[240px] rounded-lg border border-mist-200 bg-white shadow-[0_8px_24px_rgba(11,18,16,0.08)] dark:border-mist-800 dark:bg-mist-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <Select.Viewport className="p-1.5">
              {options.map((option) => (
                <Select.Item
                  key={toValue(option.value)}
                  value={toValue(option.value)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-6 rounded-md px-2.5 py-2 text-sm outline-none',
                    'data-[highlighted]:bg-mist-100 dark:data-[highlighted]:bg-mist-800'
                  )}
                >
                  <Select.ItemText>
                    {option.label}
                    {option.description ? (
                      <span className="ml-2 text-xs text-mist-500 dark:text-mist-400">
                        {option.description}
                      </span>
                    ) : null}
                  </Select.ItemText>
                  <Select.ItemIndicator>
                    <Check
                      className="h-4 w-4 text-primary-700 dark:text-primary-300"
                      strokeWidth={1.5}
                    />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {(selected?.description || meta) && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs leading-5 text-mist-500 dark:text-mist-400">
          {selected?.description && <span>{selected.description}</span>}
          {meta && <span className="mono">{meta}</span>}
        </p>
      )}
    </div>
  );
}

interface SettingToggleProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-mist-200 bg-mist-50 p-3 dark:border-mist-800 dark:bg-mist-950/50">
      <div className="flex items-start gap-2.5">
        <Icon
          className="mt-0.5 h-4 w-4 text-mist-500 dark:text-mist-400"
          strokeWidth={1.5}
        />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-mist-500 dark:text-mist-400">
            {description}
          </p>
        </div>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className={cn(
          'relative h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-mist-50 dark:focus:ring-primary-300 dark:focus:ring-offset-mist-950',
          checked
            ? 'bg-primary-700 dark:bg-primary-400'
            : 'bg-mist-300 dark:bg-mist-700'
        )}
      >
        <Switch.Thumb
          className={cn(
            'block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out',
            'dark:bg-mist-950',
            checked ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </Switch.Root>
    </div>
  );
}

function resolutionToValue(value: ResolutionCap): string {
  return String(value);
}

function resolutionFromValue(value: string): ResolutionCap {
  switch (value) {
    case 'source':
      return 'source';
    case '1080':
      return 1080;
    case '720':
      return 720;
    case '480':
      return 480;
    case '360':
      return 360;
    case '240':
      return 240;
    default:
      return 'auto';
  }
}

function fpsToValue(value: FpsCap): string {
  return String(value);
}

function fpsFromValue(value: string): FpsCap {
  switch (value) {
    case 'source':
      return 'source';
    case '60':
      return 60;
    case '30':
      return 30;
    case '24':
      return 24;
    default:
      return 'auto';
  }
}

function audioToValue(value: AudioKbps): string {
  return String(value);
}

function audioFromValue(value: string): AudioKbps {
  switch (value) {
    case '64':
      return 64;
    case '96':
      return 96;
    case '128':
      return 128;
    case '192':
      return 192;
    default:
      return 'auto';
  }
}
