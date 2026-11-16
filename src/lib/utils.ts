import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  detectContainer,
  getFileExtension,
  isSupportedContainer,
  isSupportedExtension,
  isSupportedMimeType,
  isSupportedVideoFile,
  rotationFromMatrix,
  validateVideoFile,
  type FileValidation,
  type SupportedContainer,
} from './media';

export {
  detectContainer,
  getFileExtension,
  isSupportedContainer,
  isSupportedExtension,
  isSupportedMimeType,
  isSupportedVideoFile,
  rotationFromMatrix,
  validateVideoFile,
};
export type { FileValidation, SupportedContainer };

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];

  if (!size) return `${bytes} Bytes`;

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${size}`;
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bitrate to human-readable string
 */
export function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) {
    return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  }
  if (bps >= 1_000) {
    return `${(bps / 1_000).toFixed(0)} kbps`;
  }
  return `${bps} bps`;
}

/**
 * Format percentage with specified decimals
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage reduction
 */
export function calculateReduction(original: number, final: number): number {
  if (original === 0) return 0;
  return ((original - final) / original) * 100;
}

/**
 * Check if WebCodecs is available
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoDecoder !== 'undefined' &&
    typeof EncodedVideoChunk !== 'undefined' &&
    typeof VideoFrame !== 'undefined'
  );
}

export function isAudioWebCodecsSupported(): boolean {
  return (
    typeof AudioEncoder !== 'undefined' &&
    typeof AudioDecoder !== 'undefined' &&
    typeof AudioData !== 'undefined'
  );
}

export async function supportsVideoEncoding(codec = 'avc1.42001f'): Promise<boolean> {
  if (typeof VideoEncoder === 'undefined') return false;
  try {
    const support = await VideoEncoder.isConfigSupported({
      codec,
      width: 1280,
      height: 720,
      bitrate: 2_000_000,
      framerate: 30,
      bitrateMode: 'variable',
    });
    return Boolean(support.supported);
  } catch {
    return false;
  }
}

export async function supportsVideoDecoding(codec = 'avc1.42001f'): Promise<boolean> {
  if (typeof VideoDecoder === 'undefined') return false;
  try {
    const support = await VideoDecoder.isConfigSupported({ codec });
    return Boolean(support.supported);
  } catch {
    return false;
  }
}

export async function supportsAudioEncoding(): Promise<boolean> {
  if (!isAudioWebCodecsSupported()) return false;

  try {
    const [encoderSupport, decoderSupport] = await Promise.all([
      AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate: 48_000,
        numberOfChannels: 2,
        bitrate: 128_000,
      }),
      AudioDecoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate: 48_000,
        numberOfChannels: 2,
      }),
    ]);
    return Boolean(encoderSupport.supported && decoderSupport.supported);
  } catch {
    return false;
  }
}

export async function supportsAacAudio(): Promise<boolean> {
  return supportsAudioEncoding();
}

export async function getSupportedVideoCodec(
  candidates: readonly string[]
): Promise<string | null> {
  for (const codec of candidates) {
    if (await supportsVideoEncoding(codec)) return codec;
  }
  return null;
}

export function isFileTypeSupported(file: File): boolean {
  return isSupportedVideoFile(file);
}

export function isContainerSupported(container: string | null): boolean {
  return isSupportedContainer(container);
}

export function getOutputFilename(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return `${base}_squeezed.mp4`;
}


/**
 * Check if running in a Chromium-based browser
 */
export function isChromiumBased(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Firefox|FxiOS/i.test(ua)) return false;
  const isChromium = /Chrome|Chromium|CriOS|Edg|OPR|Brave/i.test(ua);
  if (!isChromium) return false;
  return !/Version\/[\d.]+.*Safari/i.test(ua);
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
