import aac from '@audio/encode-aac';

export const AAC_SAMPLE_RATES: readonly number[] = [
  96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350,
];

const AAC_LC_OBJECT_TYPE = 2;
const WASM_FEED_FRAMES = 4096;

export interface AdtsFrame {
  payload: Uint8Array;
  durationSamples: number;
}

export interface WasmAacOptions {
  planar: Float32Array[];
  sampleRate: number;
  channels: number;
  bitrateKbps: number;
  checkCancelled?: () => void;
  onProgress?: (fraction: number) => void;
}

export interface WasmAacResult {
  adts: Uint8Array;
  priming: number;
  frameLength: number;
}

export function buildAacAsc(sampleRate: number, channels: number): Uint8Array {
  const frequencyIndex = AAC_SAMPLE_RATES.indexOf(sampleRate);
  if (frequencyIndex < 0) {
    throw new Error(`Unsupported AAC sample rate: ${sampleRate} Hz`);
  }
  if (!Number.isInteger(channels) || channels < 1 || channels > 7) {
    throw new Error(`Unsupported AAC channel count: ${channels}`);
  }

  const asc = new Uint8Array(2);
  asc[0] = (AAC_LC_OBJECT_TYPE << 3) | ((frequencyIndex >> 1) & 0x07);
  asc[1] = ((frequencyIndex & 0x01) << 7) | ((channels & 0x0f) << 3);
  return asc;
}

function isZeroFilled(data: Uint8Array, offset: number): boolean {
  for (let index = offset; index < data.length; index += 1) {
    if (data[index] !== 0) return false;
  }
  return true;
}

export function* parseAdtsFrames(adts: Uint8Array): Generator<AdtsFrame> {
  let offset = 0;

  while (offset < adts.length) {
    const remaining = adts.length - offset;
    if (remaining < 7) {
      if (isZeroFilled(adts, offset)) return;
      throw new Error(`Truncated ADTS header at byte ${offset}`);
    }

    const byte0 = adts[offset] as number;
    const byte1 = adts[offset + 1] as number;
    const byte2 = adts[offset + 2] as number;
    const byte3 = adts[offset + 3] as number;
    const byte4 = adts[offset + 4] as number;
    const byte5 = adts[offset + 5] as number;
    const byte6 = adts[offset + 6] as number;

    const hasSync = byte0 === 0xff && (byte1 & 0xf0) === 0xf0;
    const layerIsZero = (byte1 & 0x06) === 0;
    if (!hasSync || !layerIsZero) {
      if (isZeroFilled(adts, offset)) return;
      throw new Error(`Invalid ADTS sync word at byte ${offset}`);
    }

    const frequencyIndex = (byte2 >> 2) & 0x0f;
    if (frequencyIndex > 12) {
      throw new Error(`Invalid ADTS sampling frequency index at byte ${offset}`);
    }

    const protectionAbsent = (byte1 & 0x01) === 1;
    const headerLength = protectionAbsent ? 7 : 9;
    if (offset + headerLength > adts.length) {
      throw new Error(`Truncated ADTS header at byte ${offset}`);
    }

    const frameLength =
      ((byte3 & 0x03) << 11) | (byte4 << 3) | ((byte5 >> 5) & 0x07);
    if (frameLength < headerLength || offset + frameLength > adts.length) {
      throw new Error(`Invalid ADTS frame length at byte ${offset}`);
    }

    const rawDataBlocks = byte6 & 0x03;
    const payload = adts.subarray(offset + headerLength, offset + frameLength);
    yield { payload, durationSamples: 1024 * (rawDataBlocks + 1) };
    offset += frameLength;
  }
}

export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 0) return new Uint8Array(0);
  if (arrays.length === 1) return arrays[0] as Uint8Array;

  let length = 0;
  for (const array of arrays) length += array.length;

  const output = new Uint8Array(length);
  let offset = 0;
  for (const array of arrays) {
    output.set(array, offset);
    offset += array.length;
  }
  return output;
}

export async function encodeWasmAac(options: WasmAacOptions): Promise<WasmAacResult> {
  const { planar, sampleRate, channels, bitrateKbps } = options;
  if (planar.length === 0) {
    throw new Error('No audio channels were supplied for AAC encoding.');
  }
  if (planar.length !== channels) {
    throw new Error(
      `Expected ${channels} planar audio channels but received ${planar.length}.`
    );
  }

  const frameCount = planar[0]?.length ?? 0;
  const encoder = await aac({
    sampleRate,
    channels,
    bitrate: bitrateKbps,
    profile: 'lc',
  });

  const priming = encoder.priming ?? 0;
  const frameLength = encoder.frameLength ?? 1024;
  const parts: Uint8Array[] = [];

  try {
    for (let offset = 0; offset < frameCount; offset += WASM_FEED_FRAMES) {
      options.checkCancelled?.();
      const end = Math.min(frameCount, offset + WASM_FEED_FRAMES);
      const chunk = planar.map((plane) => plane.subarray(offset, end));
      const output = await encoder.encode(chunk);
      if (output.length > 0) parts.push(output);
      options.onProgress?.(end / frameCount);
    }

    const tail = await encoder.flush();
    if (tail.length > 0) parts.push(tail);
  } finally {
    encoder.free();
  }

  return {
    adts: concatUint8Arrays(parts),
    priming,
    frameLength,
  };
}
