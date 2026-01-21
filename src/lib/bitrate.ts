import { ENCODING, RESOLUTION_STEPS } from './constants';
import type { CompressionSettings, EncodingParams, VideoMetadata } from '../types';

/**
 * Calculate initial encoding parameters based on target size and video metadata
 */
export function calculateEncodingParams(
  metadata: VideoMetadata,
  settings: CompressionSettings
): EncodingParams {
  const { duration, width, height, fps } = metadata;
  const { targetSizeBytes, audioBitrate, muteAudio, targetResolution } = settings;

  // Calculate output dimensions
  let outputWidth = width;
  let outputHeight = height;
  
  if (targetResolution && targetResolution > 0 && targetResolution < height) {
    const scaled = calculateScaledDimensions(width, height, targetResolution);
    outputWidth = scaled.width;
    outputHeight = scaled.height;
  }

  // Calculate total available bitrate
  const targetBits = targetSizeBytes * 8;
  const totalBps = Math.floor(targetBits / duration);

  // Reserve bits for audio (or 0 if muted)
  const effectiveAudioBps = muteAudio ? 0 : audioBitrate;

  // Apply safety margin and subtract audio
  const videoBps = Math.floor((totalBps - effectiveAudioBps) * ENCODING.SAFETY_MARGIN);

  return {
    videoBitrate: Math.max(videoBps, ENCODING.MIN_VIDEO_BITRATE),
    audioBitrate: effectiveAudioBps,
    width: outputWidth,
    height: outputHeight,
    fps,
    muteAudio,
  };
}

/**
 * Calculate adjusted bitrate after an encoding attempt exceeded target
 */
export function calculateRetryBitrate(
  currentBitrate: number,
  actualSize: number,
  targetSize: number
): number {
  // Proportional adjustment: reduce bitrate based on how much we exceeded
  const ratio = targetSize / actualSize;
  const newBitrate = Math.floor(currentBitrate * ratio * ENCODING.RETRY_REDUCTION_FACTOR);
  return Math.max(newBitrate, ENCODING.MIN_VIDEO_BITRATE);
}

/**
 * Check if current bitrate is too low for the given resolution
 */
export function isBitrateTooLowForResolution(
  bitrate: number,
  height: number
): boolean {
  // Find the appropriate minimum bitrate threshold
  const sortedHeights = Object.keys(ENCODING.MIN_BITRATE_PER_HEIGHT)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of sortedHeights) {
    if (height >= threshold) {
      const minBitrate = ENCODING.MIN_BITRATE_PER_HEIGHT[threshold];
      if (minBitrate !== undefined) {
        return bitrate < minBitrate * 0.5; // Allow 50% below recommended minimum
      }
    }
  }

  return bitrate < ENCODING.MIN_VIDEO_BITRATE;
}

/**
 * Get the next downscale resolution step
 */
export function getNextResolutionStep(
  currentHeight: number
): { width: number; height: number } | null {
  // Find current step index
  const currentStepIndex = RESOLUTION_STEPS.findIndex(
    (step) => currentHeight >= step.maxHeight
  );

  // Get next lower resolution
  const nextIndex = currentStepIndex + 1;
  if (nextIndex >= RESOLUTION_STEPS.length) {
    return null; // Already at minimum resolution
  }

  const nextStep = RESOLUTION_STEPS[nextIndex];
  if (!nextStep) return null;

  return {
    width: 0, // Will be calculated to maintain aspect ratio
    height: nextStep.maxHeight,
  };
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  targetHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  let newHeight = Math.min(targetHeight, originalHeight);
  let newWidth = Math.round(newHeight * aspectRatio);

  // Ensure dimensions are even (required for H.264)
  newWidth = newWidth % 2 === 0 ? newWidth : newWidth - 1;
  newHeight = newHeight % 2 === 0 ? newHeight : newHeight - 1;

  return { width: newWidth, height: newHeight };
}

/**
 * Estimate output size based on bitrate and duration
 */
export function estimateOutputSize(
  videoBitrate: number,
  audioBitrate: number,
  durationSeconds: number
): number {
  const totalBits = (videoBitrate + audioBitrate) * durationSeconds;
  return Math.ceil(totalBits / 8);
}

/**
 * Check if target size is achievable without downscaling
 */
export function isTargetAchievableAtResolution(
  targetSizeBytes: number,
  durationSeconds: number,
  height: number,
  audioBitrate: number
): boolean {
  const targetBits = targetSizeBytes * 8;
  const totalBps = targetBits / durationSeconds;
  const videoBps = totalBps - audioBitrate;

  // Check against minimum quality bitrate for this resolution
  const sortedHeights = Object.keys(ENCODING.MIN_BITRATE_PER_HEIGHT)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of sortedHeights) {
    if (height >= threshold) {
      const minBitrate = ENCODING.MIN_BITRATE_PER_HEIGHT[threshold];
      if (minBitrate !== undefined) {
        return videoBps >= minBitrate * 0.3; // Allow very low quality
      }
    }
  }

  return videoBps >= ENCODING.MIN_VIDEO_BITRATE;
}

/**
 * Get suggested target size for a video
 */
export function getSuggestedTargetSize(
  durationSeconds: number,
  height: number
): number {
  // Base recommendation on duration and resolution
  const baseMultiplier = height >= 1080 ? 2 : height >= 720 ? 1.5 : 1;
  const mbPerMinute = 10 * baseMultiplier;
  const minutes = durationSeconds / 60;

  return Math.ceil(minutes * mbPerMinute * 1024 * 1024);
}
