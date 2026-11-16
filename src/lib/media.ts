import { FILE_LIMITS, SUPPORTED_VIDEO_EXTENSIONS, SUPPORTED_VIDEO_TYPES } from './constants';
import type { CompressionErrorCode, Rotation } from '../types';

export type SupportedContainer = 'mp4' | 'mov' | 'm4v';

export interface FileValidation {
  valid: boolean;
  code?: CompressionErrorCode;
  error?: string;
}

const MP4_BRANDS = new Set([
  'isom',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'iso8',
  'iso9',
  'mp41',
  'mp42',
  'avc1',
  'dash',
  'msnv',
  'M4V',
  'M4VH',
  'M4VP',
  'mmp4',
]);

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return '';
  return filename.slice(dot).toLowerCase();
}

export function getFileMimeType(file: { type?: string }): string {
  return (file.type ?? '').toLowerCase();
}

export function containerFromBrand(brand: string): SupportedContainer | null {
  const normalized = brand.trim();
  if (normalized === 'qt') return 'mov';
  if (normalized === 'M4V' || normalized === 'M4VH' || normalized === 'M4VP') return 'm4v';
  if (MP4_BRANDS.has(normalized)) return 'mp4';
  return null;
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += String.fromCharCode(bytes[offset + i] ?? 0);
  }
  return value;
}

export function detectContainer(input: ArrayBuffer | Uint8Array): SupportedContainer | null {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength < 12) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const limit = Math.min(bytes.byteLength, 128 * 1024);
  let offset = 0;

  while (offset + 8 <= limit) {
    const size = view.getUint32(offset);
    const type = readAscii(bytes, offset + 4, 4);

    if (type === 'ftyp') {
      if (offset + 12 > bytes.byteLength) return null;
      const majorBrand = readAscii(bytes, offset + 8, 4);
      const majorContainer = containerFromBrand(majorBrand);
      if (majorContainer) return majorContainer;

      const boxEnd = size >= 8 ? Math.min(offset + size, bytes.byteLength) : bytes.byteLength;
      for (let brandOffset = offset + 16; brandOffset + 4 <= boxEnd; brandOffset += 4) {
        const container = containerFromBrand(readAscii(bytes, brandOffset, 4));
        if (container) return container;
      }
      return null;
    }

    if (size < 8) break;
    offset += size;
  }

  return null;
}

export function isSupportedContainer(container: string | null): boolean {
  return container === 'mp4' || container === 'mov' || container === 'm4v';
}

export function isSupportedExtension(filename: string): boolean {
  return SUPPORTED_VIDEO_EXTENSIONS.includes(getFileExtension(filename));
}

export function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_VIDEO_TYPES.includes(mimeType.toLowerCase());
}

export function isSupportedVideoFile(file: File): boolean {
  if (isSupportedExtension(file.name)) return true;
  const mime = getFileMimeType(file);
  return mime.length > 0 && isSupportedMimeType(mime);
}

export function validateVideoFile(file: File): FileValidation {
  if (file.size <= 0) {
    return { valid: false, code: 'read-failed', error: 'That file is empty.' };
  }
  if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      code: 'file-too-large',
      error: 'That file is larger than the 2 GB in-browser limit.',
    };
  }

  const mime = getFileMimeType(file);
  if (!isSupportedExtension(file.name) && mime.length > 0 && !isSupportedMimeType(mime)) {
    return {
      valid: false,
      code: 'unsupported-container',
      error: 'Only MP4, MOV and M4V files are supported.',
    };
  }
  if (!isSupportedExtension(file.name) && mime.length === 0) {
    return {
      valid: false,
      code: 'unsupported-container',
      error: 'Only MP4, MOV and M4V files are supported.',
    };
  }

  return { valid: true };
}

export function rotationFromMatrix(matrix: readonly number[] | undefined | null): Rotation {
  if (!matrix || matrix.length < 4) return 0;
  const a = (matrix[0] ?? 0) / 65536;
  const b = (matrix[1] ?? 0) / 65536;
  if (Math.abs(a) < 0.001 && Math.abs(b) < 0.001) return 0;

  const degrees = (Math.atan2(b, a) * 180) / Math.PI;
  const normalized = ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

export function displayDimensions(
  width: number,
  height: number,
  rotation: Rotation
): { width: number; height: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

export function evenDimension(value: number): number {
  const rounded = Math.round(value);
  const even = rounded - (rounded % 2);
  return Math.max(2, even);
}

export function scaleToHeight(
  width: number,
  height: number,
  targetHeight: number
): { width: number; height: number } {
  if (height <= 0 || width <= 0 || targetHeight <= 0) {
    return { width: 2, height: 2 };
  }
  const scale = Math.min(1, targetHeight / height);
  return {
    width: evenDimension(width * scale),
    height: evenDimension(height * scale),
  };
}
