import {
  AUTO_FPS_FALLBACK,
  AUTO_RESOLUTION_CEILING,
  ENCODING,
  MIN_BITRATE_PER_HEIGHT,
  RESOLUTION_LADDER,
} from './constants';
import { evenDimension } from './media';
import type {
  AudioKbps,
  CompressionSettings,
  FpsCap,
  ResolutionCap,
  Rotation,
  VideoMetadata,
} from '../types';

const FIXED_CONTAINER_OVERHEAD_BYTES = 4096;
const MONO_AUDIO_THRESHOLD = 64_000;

export interface ResolutionLevel {
  width: number;
  height: number;
  sourceHeight: number;
}

export interface AudioPlan {
  bitrate: number;
  channels: number;
}

export interface AttemptPlan {
  width: number;
  height: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  audioChannels: number;
  muteAudio: boolean;
  levelIndex: number;
}

export interface EncodingPlan {
  sourceWidth: number;
  sourceHeight: number;
  sourceFps: number;
  rotation: Rotation;
  durationSeconds: number;
  tolerance: number;
  passCount: number;
  audio: AudioPlan;
  levels: ResolutionLevel[];
  initialLevelIndex: number;
  initialFps: number;
  initialVideoBitrate: number;
  autoDownscale: boolean;
  fpsMode: FpsCap;
  resolutionMode: ResolutionCap;
}

export interface ResultClassification {
  hitTarget: boolean;
  overTarget: boolean;
  withinTolerance: boolean;
  targetDeltaRatio: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function minVideoBitrateForHeight(height: number): number {
  const thresholds = Object.keys(MIN_BITRATE_PER_HEIGHT)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (height >= threshold) {
      return MIN_BITRATE_PER_HEIGHT[threshold] ?? ENCODING.MIN_VIDEO_BITRATE;
    }
  }
  return ENCODING.MIN_VIDEO_BITRATE;
}

export function estimateContainerOverheadBps(
  totalBps: number,
  durationSeconds: number
): number {
  const ratioOverhead = totalBps * ENCODING.CONTAINER_OVERHEAD_RATIO;
  const fixedOverhead =
    durationSeconds > 0
      ? (FIXED_CONTAINER_OVERHEAD_BYTES * 8) / durationSeconds
      : FIXED_CONTAINER_OVERHEAD_BYTES * 8;
  return Math.max(ratioOverhead, fixedOverhead);
}

export function calculateVideoBitrate(
  targetSizeBytes: number,
  durationSeconds: number,
  audioBitrate: number
): number {
  if (durationSeconds <= 0) return ENCODING.MIN_VIDEO_BITRATE;
  const totalBps = (targetSizeBytes * 8) / durationSeconds;
  const overheadBps = estimateContainerOverheadBps(totalBps, durationSeconds);
  const videoBps = totalBps - audioBitrate - overheadBps;
  return Math.max(Math.round(videoBps), ENCODING.MIN_VIDEO_BITRATE);
}

export function deriveAudioPlan(
  settings: CompressionSettings,
  durationSeconds: number,
  hasAudio: boolean,
  sourceChannels: number
): AudioPlan {
  if (!hasAudio || settings.muteAudio) {
    return { bitrate: 0, channels: 0 };
  }

  const sourceChannelCount = Math.max(1, Math.round(sourceChannels || 1));
  const totalBps =
    durationSeconds > 0 ? (settings.targetSizeBytes * 8) / durationSeconds : ENCODING.MIN_VIDEO_BITRATE;

  if (settings.audioKbps !== 'auto') {
    const explicit = Number(settings.audioKbps) * 1000;
    const bitrate = clamp(explicit, ENCODING.MIN_AUDIO_BITRATE, ENCODING.MAX_AUDIO_BITRATE);
    return { bitrate, channels: sourceChannelCount };
  }

  const desired = totalBps * 0.1;
  const tinyFloor = Math.min(ENCODING.MIN_AUDIO_BITRATE, Math.max(16_000, totalBps * 0.12));
  const bitrate = Math.round(
    clamp(desired, tinyFloor, ENCODING.AUTO_AUDIO_MAX_BITRATE)
  );
  const channels =
    sourceChannelCount > 1 && bitrate < MONO_AUDIO_THRESHOLD ? 1 : sourceChannelCount;

  return { bitrate, channels };
}

export function buildResolutionLevels(
  width: number,
  height: number,
  resolution: ResolutionCap,
  autoDownscale: boolean
): ResolutionLevel[] {
  const display = { width, height };
  if (display.width <= 0 || display.height <= 0) return [];

  let ceiling = display.height;
  if (resolution === 'auto') {
    ceiling = Math.min(display.height, AUTO_RESOLUTION_CEILING);
  } else if (typeof resolution === 'number') {
    ceiling = Math.min(display.height, resolution);
  }

  const initialHeight = Math.max(2, Math.round(ceiling));
  const heights: number[] = [initialHeight];

  if (autoDownscale && resolution !== 'source') {
    for (const ladderHeight of RESOLUTION_LADDER) {
      if (ladderHeight < initialHeight && ladderHeight <= display.height && !heights.includes(ladderHeight)) {
        heights.push(ladderHeight);
      }
    }
    const sourceEven = evenDimension(display.height);
    if (
      resolution === 'auto' &&
      sourceEven < initialHeight &&
      sourceEven >= 240 &&
      !heights.includes(sourceEven)
    ) {
      heights.splice(1, 0, sourceEven);
    }
  }

  return heights.map((targetHeight) => {
    const target = scaleDisplayHeight(display.width, display.height, targetHeight);
    return { width: target.width, height: target.height, sourceHeight: display.height };
  });
}

function scaleDisplayHeight(
  width: number,
  height: number,
  targetHeight: number
): { width: number; height: number } {
  const scale = Math.min(1, targetHeight / height);
  return {
    width: evenDimension(width * scale),
    height: evenDimension(height * scale),
  };
}

export function selectInitialLevelIndex(
  levels: ResolutionLevel[],
  videoBitrate: number
): number {
  if (levels.length === 0) return 0;
  for (let index = 0; index < levels.length; index += 1) {
    const level = levels[index];
    if (!level) continue;
    if (videoBitrate >= minVideoBitrateForHeight(level.height)) {
      return index;
    }
  }
  return levels.length - 1;
}

export function normalizeSourceFps(fps: number): number {
  if (!Number.isFinite(fps) || fps <= 0) return AUTO_FPS_FALLBACK;
  return clamp(fps, 1, 240);
}

export function deriveFps(cap: FpsCap, sourceFps: number): number {
  const source = normalizeSourceFps(sourceFps);
  if (cap === 'source' || cap === 'auto') return source;
  return Math.min(source, cap);
}

export function reduceFpsForTarget(
  cap: FpsCap,
  currentFps: number,
  sourceFps: number,
  videoBitrate: number,
  targetHeight: number
): number {
  if (cap !== 'auto') return currentFps;
  const source = normalizeSourceFps(sourceFps);
  if (currentFps <= AUTO_FPS_FALLBACK) return currentFps;
  if (source <= AUTO_FPS_FALLBACK) return currentFps;
  if (videoBitrate < minVideoBitrateForHeight(targetHeight)) {
    return AUTO_FPS_FALLBACK;
  }
  return currentFps;
}

export function createEncodingPlan(
  metadata: VideoMetadata,
  settings: CompressionSettings,
  maxPasses: number,
  tolerance: number,
  autoDownscale: boolean
): EncodingPlan {
  const durationSeconds = Math.max(metadata.duration, 0.001);
  const sourceFps = normalizeSourceFps(metadata.fps);
  const hasAudio = metadata.hasAudio && !settings.muteAudio;
  const audio = deriveAudioPlan(settings, durationSeconds, hasAudio, metadata.audioChannels ?? 2);
  const levels = buildResolutionLevels(
    metadata.width,
    metadata.height,
    settings.resolution,
    autoDownscale
  );
  const fallbackLevel: ResolutionLevel = {
    width: evenDimension(metadata.width),
    height: evenDimension(metadata.height),
    sourceHeight: metadata.height,
  };
  const safeLevels = levels.length > 0 ? levels : [fallbackLevel];
  const initialLevelIndex = selectInitialLevelIndex(
    safeLevels,
    calculateVideoBitrate(settings.targetSizeBytes, durationSeconds, audio.bitrate)
  );
  const initialLevel = safeLevels[initialLevelIndex] ?? fallbackLevel;
  const initialVideoBitrate = calculateVideoBitrate(
    settings.targetSizeBytes,
    durationSeconds,
    audio.bitrate
  );
  const baselineFps = deriveFps(settings.fps, sourceFps);
  const initialFps = reduceFpsForTarget(
    settings.fps,
    baselineFps,
    sourceFps,
    initialVideoBitrate,
    initialLevel.height
  );

  return {
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    sourceFps,
    rotation: metadata.rotation,
    durationSeconds,
    tolerance,
    passCount: maxPasses,
    audio,
    levels: safeLevels,
    initialLevelIndex,
    initialFps,
    initialVideoBitrate,
    autoDownscale,
    fpsMode: settings.fps,
    resolutionMode: settings.resolution,
  };
}

export function createAttemptPlan(
  plan: EncodingPlan,
  levelIndex: number,
  fps: number,
  videoBitrate: number
): AttemptPlan {
  const level = plan.levels[levelIndex] ?? plan.levels[plan.levels.length - 1];
  const width = level?.width ?? evenDimension(plan.sourceWidth);
  const height = level?.height ?? evenDimension(plan.sourceHeight);

  return {
    width,
    height,
    fps,
    videoBitrate: Math.max(ENCODING.MIN_VIDEO_BITRATE, Math.round(videoBitrate)),
    audioBitrate: plan.audio.bitrate,
    audioChannels: plan.audio.channels,
    muteAudio: plan.audio.channels === 0,
    levelIndex,
  };
}

export function correctVideoBitrate(
  currentBitrate: number,
  actualBytes: number,
  targetBytes: number,
  durationSeconds: number
): number {
  if (durationSeconds <= 0) return currentBitrate;
  const deltaBytes = targetBytes - actualBytes;
  const deltaBps = (deltaBytes * 8) / durationSeconds;
  const gain = deltaBytes > 0 ? 0.8 : 0.9;
  return Math.max(
    ENCODING.MIN_VIDEO_BITRATE,
    Math.round(currentBitrate + deltaBps * gain)
  );
}

export function classifyResult(
  outputBytes: number,
  targetBytes: number,
  tolerance: number
): ResultClassification {
  const targetDeltaRatio =
    targetBytes > 0 ? (outputBytes - targetBytes) / targetBytes : 0;
  return {
    hitTarget: outputBytes <= targetBytes,
    overTarget: outputBytes > targetBytes,
    withinTolerance: Math.abs(targetDeltaRatio) <= tolerance,
    targetDeltaRatio,
  };
}

export function shouldCorrectUp(
  outputBytes: number,
  targetBytes: number,
  tolerance: number
): boolean {
  return outputBytes < targetBytes * (1 - 2 * tolerance);
}

export function nextLargerBitrate(
  currentBitrate: number,
  durationSeconds: number,
  targetBytes: number,
  outputBytes: number
): number {
  const deltaBps = ((targetBytes - outputBytes) * 8) / Math.max(durationSeconds, 0.001);
  return Math.max(currentBitrate + 1, Math.round(currentBitrate + deltaBps));
}

export function resolveSettings(
  settings: CompressionSettings,
  defaults: { maxPasses: number; tolerance: number; autoDownscale: boolean }
): { maxPasses: number; tolerance: number; autoDownscale: boolean } {
  const maxPasses = clamp(
    Math.round(settings.passesOverride ?? defaults.maxPasses),
    1,
    12
  );
  const tolerance = clamp(settings.toleranceOverride ?? defaults.tolerance, 0.001, 0.5);
  return { maxPasses, tolerance, autoDownscale: defaults.autoDownscale };
}

export function audioKbpsToBps(value: AudioKbps): number {
  return value === 'auto' ? 0 : Number(value) * 1000;
}

export function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  targetHeight: number
): { width: number; height: number } {
  return scaleDisplayHeight(originalWidth, originalHeight, targetHeight);
}

export function estimateOutputSize(
  videoBitrate: number,
  audioBitrate: number,
  durationSeconds: number
): number {
  const totalBits = (videoBitrate + audioBitrate) * durationSeconds;
  return Math.ceil(totalBits / 8);
}

export function isBitrateTooLowForResolution(bitrate: number, height: number): boolean {
  return bitrate < minVideoBitrateForHeight(height);
}

export function isTargetAchievableAtResolution(
  targetSizeBytes: number,
  durationSeconds: number,
  height: number,
  audioBitrate: number
): boolean {
  const videoBps = calculateVideoBitrate(targetSizeBytes, durationSeconds, audioBitrate);
  return videoBps >= minVideoBitrateForHeight(height);
}

export function getSuggestedTargetSize(
  durationSeconds: number,
  height: number
): number {
  const baseMultiplier = height >= 1080 ? 2 : height >= 720 ? 1.5 : 1;
  const mbPerMinute = 10 * baseMultiplier;
  return Math.ceil((durationSeconds / 60) * mbPerMinute * 1024 * 1024);
}
