import * as Accordion from '@radix-ui/react-accordion';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Settings2 } from 'lucide-react';
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
  // Filter resolution options to only show those smaller than or equal to original
  const availableResolutions = RESOLUTION_OPTIONS.filter(
    (r) => r.maxHeight === 0 || r.maxHeight <= metadata.height
  );

  return (
    <Accordion.Root type="single" collapsible>
      <Accordion.Item value="advanced" className="overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-700">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-gray-400" />
              <span className="font-semibold">Advanced Settings</span>
              <span className="text-sm text-gray-400">Resolution, Audio</span>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-300 group-data-[state=open]:rotate-180" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="space-y-5 border-t border-gray-200 px-5 py-5 dark:border-gray-700">
            
            {/* Resolution Picker */}
            <div>
              <label className="label flex items-center gap-2">
                <span>📐</span> Output Resolution
              </label>
              <Select.Root
                value={String(targetResolution ?? 0)}
                onValueChange={(v) => onTargetResolutionChange(v === '0' ? null : Number(v))}
              >
                <Select.Trigger className="input flex items-center justify-between">
                  <Select.Value placeholder="Original" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <Select.Viewport className="p-2">
                      {availableResolutions.map((option) => (
                        <Select.Item
                          key={option.maxHeight}
                          value={String(option.maxHeight)}
                          className={cn(
                            'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm outline-none',
                            'hover:bg-gray-100 dark:hover:bg-gray-700',
                            'data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700'
                          )}
                        >
                          <Select.ItemText>
                            {option.maxHeight === 0 
                              ? `Original (${metadata.height}p)` 
                              : option.name}
                          </Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4 text-primary-500" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              <p className="mt-1.5 text-xs text-gray-500">
                Lower resolution = smaller file & faster encoding
              </p>
            </div>

            {/* Audio Bitrate */}
            {hasAudio && !muteAudio && (
              <div>
                <label className="label flex items-center gap-2">
                  <span>🔊</span> Audio Quality
                </label>
                <Select.Root
                  value={String(audioBitrate)}
                  onValueChange={(v) => onAudioBitrateChange(Number(v))}
                >
                  <Select.Trigger className="input flex items-center justify-between">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      <Select.Viewport className="p-2">
                        {AUDIO_BITRATES.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={String(option.value)}
                            className={cn(
                              'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm outline-none',
                              'hover:bg-gray-100 dark:hover:bg-gray-700',
                              'data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700'
                            )}
                          >
                            <Select.ItemText>
                              {option.label} - {option.description}
                            </Select.ItemText>
                            <Select.ItemIndicator>
                              <Check className="h-4 w-4 text-primary-500" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}

            {/* Mute Audio Toggle */}
            {hasAudio && (
              <SettingToggle
                emoji="🔇"
                label="Mute audio"
                description="Remove audio to save more space"
                checked={muteAudio}
                onCheckedChange={onMuteAudioChange}
              />
            )}

            {/* Helper text */}
            <p className="rounded-xl bg-gray-100 p-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              💡 <strong>Tip:</strong> Reducing resolution often has more impact on file size than lowering bitrate. 
              A 720p video at good quality often looks better than 1080p at low bitrate!
            </p>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

interface SettingToggleProps {
  emoji: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingToggle({ emoji, label, description, checked, onCheckedChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
      <div className="flex items-start gap-3">
        <span className="text-xl">{emoji}</span>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'relative h-7 w-12 cursor-pointer rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <Switch.Thumb
          className={cn(
            'block h-5 w-5 rounded-full bg-white shadow-md transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </Switch.Root>
    </div>
  );
}
