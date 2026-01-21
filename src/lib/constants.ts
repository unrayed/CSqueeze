import type { SizePreset, ResolutionStep } from '../types';

/**
 * Target size presets available to the user
 */
export const SIZE_PRESETS: SizePreset[] = [
  { label: '10 MB', bytes: 10 * 1024 * 1024, description: 'Discord, email' },
  { label: '25 MB', bytes: 25 * 1024 * 1024, description: 'Larger uploads' },
  { label: '50 MB', bytes: 50 * 1024 * 1024, description: 'Cloud storage' },
  { label: '100 MB', bytes: 100 * 1024 * 1024, description: 'High quality' },
];

/**
 * Audio bitrate options
 */
export const AUDIO_BITRATES = [
  { value: 64000, label: '64 kbps', description: 'Low quality, smaller size' },
  { value: 96000, label: '96 kbps', description: 'Good balance (default)' },
  { value: 128000, label: '128 kbps', description: 'Better quality' },
];

/**
 * Resolution options for user selection
 */
export const RESOLUTION_OPTIONS: ResolutionStep[] = [
  { name: 'Original', maxHeight: 0 }, // 0 means keep original
  { name: '1080p', maxHeight: 1080 },
  { name: '720p', maxHeight: 720 },
  { name: '480p', maxHeight: 480 },
  { name: '360p', maxHeight: 360 },
];

/**
 * Resolution steps for fallback downscaling (from highest to lowest)
 */
export const RESOLUTION_STEPS: ResolutionStep[] = [
  { name: '1080p', maxHeight: 1080 },
  { name: '720p', maxHeight: 720 },
  { name: '480p', maxHeight: 480 },
  { name: '360p', maxHeight: 360 },
];

/**
 * Encoding constants
 */
export const ENCODING = {
  // Safety margin to ensure output is under target (0.92 = 8% buffer)
  SAFETY_MARGIN: 0.92,
  
  // Maximum encoding attempts before giving up
  MAX_ATTEMPTS: 4,
  
  // Minimum video bitrate before requiring downscale (100 kbps)
  MIN_VIDEO_BITRATE: 100_000,
  
  // Reduction factor when retrying after exceeding target
  RETRY_REDUCTION_FACTOR: 0.95,
  
  // Minimum acceptable quality bitrate per resolution (in bps)
  MIN_BITRATE_PER_HEIGHT: {
    1080: 2_000_000,
    720: 1_000_000,
    480: 500_000,
    360: 250_000,
  } as Record<number, number>,
  
  // H.264 profile for broad compatibility
  H264_PROFILE: 'avc1.42001f', // Baseline profile, level 3.1
  H264_PROFILE_HIGH: 'avc1.640028', // High profile, level 4.0
  
  // Default keyframe interval in seconds
  KEYFRAME_INTERVAL: 2,
};

/**
 * File constraints
 */
export const FILE_LIMITS = {
  // Maximum recommended file size (warn above this)
  MAX_RECOMMENDED_SIZE: 500 * 1024 * 1024, // 500 MB
  
  // Maximum duration in seconds
  MAX_DURATION: 5 * 60, // 5 minutes
  
  // Minimum target size
  MIN_TARGET_SIZE: 1 * 1024 * 1024, // 1 MB
  
  // Maximum target size
  MAX_TARGET_SIZE: 500 * 1024 * 1024, // 500 MB
};

/**
 * Supported video MIME types
 */
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
];

/**
 * Stage labels for UI display
 */
export const STAGE_LABELS: Record<string, string> = {
  idle: 'Ready',
  reading: 'Reading file...',
  analyzing: 'Analyzing video...',
  encoding: 'Encoding video...',
  retrying: 'Adjusting quality...',
  finalizing: 'Finalizing MP4...',
  complete: 'Complete!',
  error: 'Error occurred',
  cancelled: 'Cancelled',
};
