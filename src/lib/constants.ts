import type {
  AudioKbps,
  FpsCap,
  QualityPreset,
  ResolutionCap,
  SelectOption,
  SizePreset,
} from '../types';

export const SIZE_PRESETS: SizePreset[] = [
  { label: '8 MB', bytes: 8 * 1024 * 1024, description: 'Discord with margin' },
  { label: '10 MB', bytes: 10 * 1024 * 1024, description: 'Discord, email' },
  { label: '25 MB', bytes: 25 * 1024 * 1024, description: 'Larger uploads' },
  { label: '50 MB', bytes: 50 * 1024 * 1024, description: 'Cloud storage' },
  { label: '100 MB', bytes: 100 * 1024 * 1024, description: 'High quality' },
];

export interface QualityPresetConfig {
  label: string;
  description: string;
  maxPasses: number;
  tolerance: number;
  autoDownscale: boolean;
}

export const QUALITY_PRESETS: Record<QualityPreset, QualityPresetConfig> = {
  fast: {
    label: 'Fast',
    description: 'One or two passes, keeps the source resolution',
    maxPasses: 2,
    tolerance: 0.05,
    autoDownscale: false,
  },
  balanced: {
    label: 'Balanced',
    description: 'Downscales when the target needs it, four passes',
    maxPasses: 4,
    tolerance: 0.02,
    autoDownscale: true,
  },
  best: {
    label: 'Best',
    description: 'Six passes, tightest fit, lowest resolution that keeps quality',
    maxPasses: 6,
    tolerance: 0.01,
    autoDownscale: true,
  },
};

export const QUALITY_PRESET_OPTIONS: SelectOption<QualityPreset>[] = (
  Object.keys(QUALITY_PRESETS) as QualityPreset[]
).map((value) => ({
  value,
  label: QUALITY_PRESETS[value].label,
  description: QUALITY_PRESETS[value].description,
}));

export const AUDIO_OPTIONS: SelectOption<AudioKbps>[] = [
  { value: 'auto', label: 'Auto', description: 'Derived from the size budget' },
  { value: 64, label: '64 kbps', description: 'Smallest' },
  { value: 96, label: '96 kbps', description: 'Good balance' },
  { value: 128, label: '128 kbps', description: 'Better quality' },
  { value: 192, label: '192 kbps', description: 'Music-heavy clips' },
];

export const RESOLUTION_OPTIONS: SelectOption<ResolutionCap>[] = [
  { value: 'auto', label: 'Auto', description: 'Up to 1080p, lower if the target needs it' },
  { value: 'source', label: 'Original', description: 'Keep the source resolution' },
  { value: 1080, label: '1080p', description: 'Max 1080 height' },
  { value: 720, label: '720p', description: 'Max 720 height' },
  { value: 480, label: '480p', description: 'Max 480 height' },
  { value: 360, label: '360p', description: 'Max 360 height' },
  { value: 240, label: '240p', description: 'Max 240 height' },
];

export const FPS_OPTIONS: SelectOption<FpsCap>[] = [
  { value: 'auto', label: 'Auto', description: 'Source fps, 30 when the target needs it' },
  { value: 'source', label: 'Original', description: 'Keep the source frame rate' },
  { value: 60, label: '60 fps', description: 'Smooth motion' },
  { value: 30, label: '30 fps', description: 'Standard' },
  { value: 24, label: '24 fps', description: 'Film-like, smallest' },
];

export const AUTO_RESOLUTION_CEILING = 1080;

export const AUTO_FPS_FALLBACK = 30;

export const RESOLUTION_LADDER = [1080, 720, 480, 360, 240] as const;

export const MIN_BITRATE_PER_HEIGHT: Record<number, number> = {
  1080: 1_600_000,
  720: 850_000,
  480: 420_000,
  360: 200_000,
  240: 110_000,
};

export const ENCODING = {
  MIN_VIDEO_BITRATE: 100_000,
  MIN_AUDIO_BITRATE: 48_000,
  MAX_AUDIO_BITRATE: 192_000,
  AUTO_AUDIO_MAX_BITRATE: 160_000,
  KEYFRAME_INTERVAL_SECONDS: 2,
  CONTAINER_OVERHEAD_RATIO: 0.02,
  MIN_TARGET_HEADROOM_RATIO: 0.02,
} as const;

export const FILE_LIMITS = {
  MAX_RECOMMENDED_SIZE: 500 * 1024 * 1024,
  MAX_DURATION: 5 * 60,
  MIN_TARGET_SIZE: 1 * 1024 * 1024,
  MAX_TARGET_SIZE: 500 * 1024 * 1024,
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,
} as const;

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
];

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];

export const STAGE_LABELS: Record<string, string> = {
  idle: 'Ready',
  reading: 'Reading file',
  demuxing: 'Reading tracks',
  encoding: 'Encoding video',
  finalizing: 'Writing MP4',
  complete: 'Complete',
  error: 'Error',
  cancelled: 'Cancelled',
};

export const PRESET_ORDER: QualityPreset[] = ['fast', 'balanced', 'best'];
