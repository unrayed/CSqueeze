import * as Accordion from '@radix-ui/react-accordion';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import {
  ChevronDown,
  Check,
  Settings2,
  Scaling,
  Volume2,
  VolumeX,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AUDIO_BITRATES, RESOLUTION_OPTIONS } from '../../lib/constants';
import type { VideoMetadata } from '../../types';

interface AdvancedSettingsProps {
  audioBitrate: number;
  onAudioBitrateChange: (value: number) => void;
  targetResolution: number | null;
  onTargetResolutionChange: (value: number | null) => void;
  muteAudio: boolean;
  onMuteAudioChange: (value: boolean) => void;
  hasAudio: boolean;
  metadata: VideoMetadata;
}

export function AdvancedSettings({
  audioBitrate,
  onAudioBitrateChange,
  targetResolution,
  onTargetResolutionChange,
  muteAudio,
  onMuteAudioChange,
  hasAudio,
  metadata,
}: AdvancedSettingsProps) {
  const availableResolutions = RESOLUTION_OPTIONS.filter(
    (r) => r.maxHeight === 0 || r.maxHeight <= metadata.height
  );

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
                Resolution, audio
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
            <div>
              <span className="label flex items-center gap-2">
                <Scaling className="h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
                Output resolution
              </span>
              <Select.Root
                value={String(targetResolution ?? 0)}
                onValueChange={(v) => onTargetResolutionChange(v === '0' ? null : Number(v))}
              >
                <Select.Trigger className="input flex items-center justify-between">
                  <Select.Value placeholder="Original" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 rounded-lg border border-mist-200 bg-white shadow-[0_8px_24px_rgba(11,18,16,0.08)] dark:border-mist-800 dark:bg-mist-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <Select.Viewport className="p-1.5">
                      {availableResolutions.map((option) => (
                        <Select.Item
                          key={option.maxHeight}
                          value={String(option.maxHeight)}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-6 rounded-md px-2.5 py-2 text-sm outline-none',
                            'data-[highlighted]:bg-mist-100 dark:data-[highlighted]:bg-mist-800'
                          )}
                        >
                          <Select.ItemText>
                            {option.maxHeight === 0
                              ? `Original (${metadata.height}p)`
                              : option.name}
                          </Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4 text-primary-700 dark:text-primary-300" strokeWidth={1.5} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              <p className="mt-1.5 text-xs text-mist-500 dark:text-mist-400">
                Lower resolution means a smaller file and faster encoding
              </p>
            </div>

            {hasAudio && !muteAudio && (
              <div>
                <span className="label flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
                  Audio quality
                </span>
                <Select.Root
                  value={String(audioBitrate)}
                  onValueChange={(v) => onAudioBitrateChange(Number(v))}
                >
                  <Select.Trigger className="input flex items-center justify-between">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 rounded-lg border border-mist-200 bg-white shadow-[0_8px_24px_rgba(11,18,16,0.08)] dark:border-mist-800 dark:bg-mist-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                      <Select.Viewport className="p-1.5">
                        {AUDIO_BITRATES.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={String(option.value)}
                            className={cn(
                              'flex cursor-pointer items-center justify-between gap-6 rounded-md px-2.5 py-2 text-sm outline-none',
                              'data-[highlighted]:bg-mist-100 dark:data-[highlighted]:bg-mist-800'
                            )}
                          >
                            <Select.ItemText>
                              {option.label} &middot; {option.description}
                            </Select.ItemText>
                            <Select.ItemIndicator>
                              <Check className="h-4 w-4 text-primary-700 dark:text-primary-300" strokeWidth={1.5} />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}

            {hasAudio && (
              <SettingToggle
                icon={VolumeX}
                label="Mute audio"
                description="Remove audio to save a little more space"
                checked={muteAudio}
                onCheckedChange={onMuteAudioChange}
              />
            )}

            <p className="flex items-start gap-2 rounded-lg border border-mist-200 bg-mist-50 p-3 text-xs leading-5 text-mist-600 dark:border-mist-800 dark:bg-mist-950/50 dark:text-mist-300">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>
                Reducing resolution often cuts more size than lowering the
                bitrate. A 720p file at good quality usually looks better than
                1080p squeezed too hard.
              </span>
            </p>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

interface SettingToggleProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingToggle({ icon: Icon, label, description, checked, onCheckedChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-mist-200 bg-mist-50 p-3 dark:border-mist-800 dark:bg-mist-950/50">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-mist-500 dark:text-mist-400">{description}</p>
        </div>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'relative h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-mist-50 dark:focus:ring-primary-300 dark:focus:ring-offset-mist-950',
          checked ? 'bg-primary-700 dark:bg-primary-400' : 'bg-mist-300 dark:bg-mist-700'
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
