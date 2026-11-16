/// <reference lib="webworker" />

import * as MP4BoxModule from 'mp4box';
import type { MP4ArrayBuffer, MP4AudioTrack, MP4File, MP4Info, MP4Sample, MP4VideoTrack } from 'mp4box';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type {
  AudioPlan,
  AttemptPlan,
  EncodingPlan,
  ResolutionLevel,
} from '../lib/bitrate';
import {
  classifyResult,
  correctVideoBitrate,
  createAttemptPlan,
  createEncodingPlan,
  minVideoBitrateForHeight,
  normalizeSourceFps,
  reduceFpsForTarget,
  resolveSettings,
} from '../lib/bitrate';
import { AUTO_FPS_FALLBACK, ENCODING, FILE_LIMITS, QUALITY_PRESETS } from '../lib/constants';
import { detectContainer, displayDimensions, rotationFromMatrix } from '../lib/media';
import type {
  CompressionError,
  CompressionErrorCode,
  CompressionProgress,
  CompressionReport,
  CompressionSettings,
  Rotation,
  VideoMetadata,
  WorkerInputMessage,
  WorkerOutputMessage,
} from '../types';

const { createFile } = MP4BoxModule;

const MAX_DECODE_QUEUE = 8;
const MAX_ENCODE_QUEUE = 8;
const DEMUX_TIMEOUT_MS = 60_000;
const H264_CODECS = [
  'avc1.640034',
  'avc1.640033',
  'avc1.64002a',
  'avc1.640028',
  'avc1.4d0033',
  'avc1.4d002a',
  'avc1.4d0028',
  'avc1.4d001f',
  'avc1.42001f',
  'avc1.42E01E',
  'avc1.64001f',
];

let cancelled = false;
let running = false;

class CancelledError extends Error {
  constructor() {
    super('Compression cancelled');
    this.name = 'CancelledError';
  }
}

class WorkerCompressionError extends Error {
  readonly code: CompressionErrorCode;
  readonly suggestion?: string;

  constructor(code: CompressionErrorCode, message: string, suggestion?: string) {
    super(message);
    this.name = 'WorkerCompressionError';
    this.code = code;
    if (suggestion !== undefined) {
      this.suggestion = suggestion;
    }
  }
}

function throwIfCancelled(): void {
  if (cancelled) throw new CancelledError();
}

function fail(code: CompressionErrorCode, message: string, suggestion?: string): never {
  throw new WorkerCompressionError(code, message, suggestion);
}

function toCompressionError(error: unknown): CompressionError {
  if (error instanceof WorkerCompressionError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.suggestion !== undefined ? { suggestion: error.suggestion } : {}),
    };
  }
  if (error instanceof RangeError) {
    return {
      code: 'memory',
      message: 'The browser ran out of memory while processing this video.',
      suggestion: 'Try a smaller file, a shorter clip, or close other tabs and try again.',
    };
  }
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return {
      code: 'memory',
      message: 'The browser ran out of memory while processing this video.',
      suggestion: 'Try a smaller file or close other tabs and try again.',
    };
  }
  const message = error instanceof Error ? error.message : 'Unknown compression error';
  return {
    code: 'unknown',
    message,
    suggestion: 'Try again with a different target size or a smaller file.',
  };
}

function postMessage(message: WorkerOutputMessage): void {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
  const message = event.data;

  if (message.type === 'cancel') {
    cancelled = true;
    if (!running) {
      postMessage({ type: 'cancelled' });
    }
    return;
  }

  if (message.type === 'compress') {
    if (running) {
      postMessage({
        type: 'error',
        error: {
          code: 'unknown',
          message: 'A compression job is already running.',
          suggestion: 'Wait for it to finish or cancel it first.',
        },
      });
      return;
    }

    running = true;
    cancelled = false;
    void compressVideo(message.file, message.filename, message.settings)
      .catch((error: unknown) => {
        if (cancelled || error instanceof CancelledError) {
          postMessage({ type: 'cancelled' });
          return;
        }
        postMessage({ type: 'error', error: toCompressionError(error) });
      })
      .finally(() => {
        running = false;
        cancelled = false;
      });
  }
};

interface AvcCBoxLike {
  configurationVersion?: number;
  AVCProfileIndication?: number;
  profile_compatibility?: number;
  AVCLevelIndication?: number;
  lengthSizeMinusOne?: number;
  SPS?: Array<{ nalu?: Uint8Array; length?: number }>;
  PPS?: Array<{ nalu?: Uint8Array; length?: number }>;
  ext?: Uint8Array;
}

interface DescriptorLike {
  tag?: number;
  data?: Uint8Array;
  descs?: DescriptorLike[];
  findDescriptor?: (tag: number) => DescriptorLike | null;
}

interface SampleEntryLike {
  avcC?: AvcCBoxLike;
  hvcC?: { write?: (stream: unknown) => void; hdr_size?: number; size?: number; data?: Uint8Array };
  esds?: { esd?: DescriptorLike };
}

interface TrackBoxLike {
  mdia?: {
    minf?: {
      stbl?: {
        stsd?: {
          entries?: SampleEntryLike[];
        };
      };
    };
  };
}

interface VideoTrackLike extends MP4VideoTrack {
  matrix?: number[];
  samples_duration?: number;
}

interface AudioTrackLike extends MP4AudioTrack {
  samples_duration?: number;
}

interface DemuxVideoTrack {
  id: number;
  codec: string;
  timescale: number;
  durationSeconds: number;
  nbSamples: number;
  codedWidth: number;
  codedHeight: number;
  displayWidth: number;
  displayHeight: number;
  rotation: Rotation;
  description: Uint8Array | null;
}

interface DemuxAudioTrack {
  id: number;
  codec: string;
  timescale: number;
  durationSeconds: number;
  nbSamples: number;
  sampleRate: number;
  channels: number;
  description: Uint8Array | null;
}

interface DemuxResult {
  metadata: VideoMetadata;
  video: DemuxVideoTrack;
  audio: DemuxAudioTrack | null;
  videoSamples: MP4Sample[];
  audioSamples: MP4Sample[];
  durationSeconds: number;
  sourceFps: number;
}

interface EncodedAudio {
  chunks: EncodedAudioChunk[];
  metadata: EncodedAudioChunkMetadata | null;
  sampleRate: number;
  channels: number;
  bitrate: number;
}

interface AttemptOutput {
  buffer: ArrayBuffer;
  size: number;
  plan: AttemptPlan;
}

interface DataStreamInstance {
  buffer: ArrayBuffer;
}

interface DataStreamConstructor {
  new (buffer?: number | ArrayBuffer, byteOffset?: number, endianness?: boolean): DataStreamInstance;
}

const DataStreamCtor = (MP4BoxModule as unknown as { DataStream?: DataStreamConstructor })
  .DataStream;

function getSampleEntry(mp4box: MP4File, trackId: number): SampleEntryLike | undefined {
  const track = mp4box.getTrackById(trackId) as unknown as TrackBoxLike | undefined;
  return track?.mdia?.minf?.stbl?.stsd?.entries?.[0];
}

function naluData(value: { nalu?: Uint8Array; length?: number }): Uint8Array | null {
  if (value.nalu instanceof Uint8Array && value.nalu.byteLength > 0) return value.nalu;
  return null;
}

function serializeAvcC(avcC: AvcCBoxLike): Uint8Array | null {
  const sps: Uint8Array[] = [];
  const pps: Uint8Array[] = [];
  for (const entry of avcC.SPS ?? []) {
    const data = naluData(entry);
    if (data) sps.push(data);
  }
  for (const entry of avcC.PPS ?? []) {
    const data = naluData(entry);
    if (data) pps.push(data);
  }
  if (sps.length === 0 || pps.length === 0) return null;

  const ext = avcC.ext instanceof Uint8Array ? avcC.ext : null;
  let size = 6;
  for (const data of sps) size += 2 + data.byteLength;
  size += 1;
  for (const data of pps) size += 2 + data.byteLength;
  if (ext) size += ext.byteLength;

  const output = new Uint8Array(size);
  let offset = 0;
  output[offset] = avcC.configurationVersion ?? 1;
  offset += 1;
  output[offset] = avcC.AVCProfileIndication ?? 0x64;
  offset += 1;
  output[offset] = avcC.profile_compatibility ?? 0;
  offset += 1;
  output[offset] = avcC.AVCLevelIndication ?? 0x1f;
  offset += 1;
  output[offset] = ((avcC.lengthSizeMinusOne ?? 3) & 0x03) | 0xfc;
  offset += 1;
  output[offset] = 0xe0 | (sps.length & 0x1f);
  offset += 1;

  for (const data of sps) {
    output[offset] = (data.byteLength >> 8) & 0xff;
    output[offset + 1] = data.byteLength & 0xff;
    offset += 2;
    output.set(data, offset);
    offset += data.byteLength;
  }

  output[offset] = pps.length & 0xff;
  offset += 1;
  for (const data of pps) {
    output[offset] = (data.byteLength >> 8) & 0xff;
    output[offset + 1] = data.byteLength & 0xff;
    offset += 2;
    output.set(data, offset);
    offset += data.byteLength;
  }

  if (ext) {
    output.set(ext, offset);
  }

  return output;
}

function serializeBoxPayload(
  box: { write?: (stream: unknown) => void; hdr_size?: number; size?: number }
): Uint8Array | null {
  if (!box.write || !DataStreamCtor) return null;
  try {
    const stream = new DataStreamCtor(0, 0, false);
    box.write(stream);
    const headerSize = box.hdr_size ?? 8;
    const totalSize = box.size ?? stream.buffer.byteLength;
    const bytes = new Uint8Array(stream.buffer);
    if (totalSize <= headerSize || bytes.byteLength < totalSize) return null;
    return bytes.slice(headerSize, totalSize);
  } catch {
    return null;
  }
}

function extractAudioDescription(entry: SampleEntryLike | undefined): Uint8Array | null {
  const descriptor = entry?.esds?.esd;
  if (!descriptor) return null;

  const queue: DescriptorLike[] = [descriptor, ...(descriptor.descs ?? [])];
  if (descriptor.findDescriptor) {
    const decoderConfig = descriptor.findDescriptor(4);
    if (decoderConfig) queue.push(decoderConfig, ...(decoderConfig.descs ?? []));
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (current.tag === 5 && current.data instanceof Uint8Array) {
      return current.data;
    }
    for (const child of current.descs ?? []) queue.push(child);
  }

  return null;
}

function extractVideoDescription(entry: SampleEntryLike | undefined): Uint8Array | null {
  if (!entry) return null;
  if (entry.avcC) {
    const avcC = serializeAvcC(entry.avcC);
    if (avcC) return avcC;
  }
  if (entry.hvcC) {
    if (entry.hvcC.data instanceof Uint8Array) return entry.hvcC.data;
    const serialized = serializeBoxPayload(entry.hvcC);
    if (serialized) return serialized;
  }
  return null;
}

function demuxMp4(
  buffer: ArrayBuffer,
  filename: string,
  container: 'mp4' | 'mov' | 'm4v',
  extractSamples: boolean,
  onDemuxProgress: (fraction: number) => void
): Promise<DemuxResult> {
  return new Promise<DemuxResult>((resolve, reject) => {
    const mp4box = createFile();
    const videoSamples: MP4Sample[] = [];
    const audioSamples: MP4Sample[] = [];
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    let videoTrack: VideoTrackLike | null = null;
    let audioTrack: AudioTrackLike | null = null;
    let demuxVideo: DemuxVideoTrack | null = null;
    let demuxAudio: DemuxAudioTrack | null = null;
    let expectedVideo = 0;
    let expectedAudio = 0;
    let deliveredVideo = 0;
    let deliveredAudio = 0;
    let videoDone = false;
    let audioDone = true;

    const cleanup = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      try {
        mp4box.stop();
      } catch {
        // mp4box may already be stopped
      }
    };

    const buildResult = (): DemuxResult | null => {
      if (!demuxVideo) return null;
      const durationSeconds = Math.max(demuxVideo.durationSeconds, 0.001);
      const sourceFps = normalizeSourceFps(
        durationSeconds > 0 ? demuxVideo.nbSamples / durationSeconds : 30
      );
      const metadata: VideoMetadata = {
        filename,
        fileSize: buffer.byteLength,
        duration: durationSeconds,
        width: demuxVideo.displayWidth,
        height: demuxVideo.displayHeight,
        fps: Math.round(sourceFps * 1000) / 1000,
        videoCodec: demuxVideo.codec,
        audioCodec: demuxAudio?.codec ?? null,
        hasAudio: demuxAudio !== null,
        audioChannels: demuxAudio?.channels ?? null,
        audioSampleRate: demuxAudio?.sampleRate ?? null,
        rotation: demuxVideo.rotation,
        container,
      };
      return {
        metadata,
        video: demuxVideo,
        audio: demuxAudio,
        videoSamples,
        audioSamples,
        durationSeconds,
        sourceFps,
      };
    };

    const finish = () => {
      if (settled || !videoDone || !audioDone) return;
      const result = buildResult();
      if (!result) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const failDemux = (code: CompressionErrorCode, message: string, suggestion?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new WorkerCompressionError(code, message, suggestion));
    };

    timeout = setTimeout(() => {
      failDemux(
        'unsupported-container',
        'Reading the video timed out.',
        'Try a shorter clip or re-export the file as a standard MP4.'
      );
    }, DEMUX_TIMEOUT_MS);

    mp4box.onReady = (info: MP4Info) => {
      try {
        videoTrack = (info.videoTracks[0] as VideoTrackLike | undefined) ?? null;
        audioTrack = (info.audioTracks[0] as AudioTrackLike | undefined) ?? null;

        if (!videoTrack) {
          failDemux(
            'unsupported-codec',
            'That file has no video track.',
            'Choose a video file that contains a video stream.'
          );
          return;
        }

        const rotation = rotationFromMatrix(videoTrack.matrix);
        const display = displayDimensions(
          videoTrack.video.width,
          videoTrack.video.height,
          rotation
        );
        const videoDuration =
          videoTrack.duration > 0 && videoTrack.timescale > 0
            ? videoTrack.duration / videoTrack.timescale
            : info.duration / info.timescale;
        const audioDuration =
          audioTrack && audioTrack.duration > 0 && audioTrack.timescale > 0
            ? audioTrack.duration / audioTrack.timescale
            : 0;

        const videoEntry = getSampleEntry(mp4box, videoTrack.id);
        const audioEntry = audioTrack ? getSampleEntry(mp4box, audioTrack.id) : undefined;

        demuxVideo = {
          id: videoTrack.id,
          codec: videoTrack.codec,
          timescale: videoTrack.timescale,
          durationSeconds: Number.isFinite(videoDuration) ? videoDuration : 0,
          nbSamples: videoTrack.nb_samples,
          codedWidth: videoTrack.video.width,
          codedHeight: videoTrack.video.height,
          displayWidth: display.width,
          displayHeight: display.height,
          rotation,
          description: extractVideoDescription(videoEntry),
        };

        demuxAudio = audioTrack
          ? {
              id: audioTrack.id,
              codec: audioTrack.codec,
              timescale: audioTrack.timescale,
              durationSeconds: Number.isFinite(audioDuration) ? audioDuration : 0,
              nbSamples: audioTrack.nb_samples,
              sampleRate: audioTrack.audio.sample_rate,
              channels: audioTrack.audio.channel_count,
              description: extractAudioDescription(audioEntry),
            }
          : null;

        expectedVideo = videoTrack.nb_samples;
        expectedAudio = audioTrack?.nb_samples ?? 0;

        if (!extractSamples) {
          videoDone = expectedVideo >= 0;
          audioDone = true;
          finish();
          return;
        }

        if (expectedVideo <= 0) {
          failDemux(
            'unsupported-codec',
            'That file has no video samples.',
            'Choose a file that contains encoded video frames.'
          );
          return;
        }

        videoDone = false;
        audioDone = !audioTrack || expectedAudio <= 0;

        mp4box.setExtractionOptions(videoTrack.id, 'video', { nbSamples: Infinity });
        if (audioTrack && expectedAudio > 0) {
          mp4box.setExtractionOptions(audioTrack.id, 'audio', { nbSamples: Infinity });
        }
        mp4box.start();
        finish();
      } catch (error) {
        failDemux(
          'unsupported-container',
          `Could not read the video tracks: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
          'Re-export it as H.264 MP4 and try again.'
        );
      }
    };

    mp4box.onSamples = (trackId: number, _user: unknown, samples: MP4Sample[]) => {
      if (settled) return;

      if (videoTrack && trackId === videoTrack.id) {
        videoSamples.push(...samples);
        deliveredVideo += samples.length;
        if (samples.length > 0 && !demuxVideo?.description) {
          const sampleEntry = samples[0]?.description as SampleEntryLike | undefined;
          if (demuxVideo) demuxVideo.description = extractVideoDescription(sampleEntry);
        }
        if (deliveredVideo >= expectedVideo) videoDone = true;
        if (expectedVideo > 0) {
          onDemuxProgress(Math.min(0.99, deliveredVideo / expectedVideo));
        }
        if (samples.length >= expectedVideo - (deliveredVideo - samples.length)) {
          videoDone = true;
        }
      } else if (audioTrack && trackId === audioTrack.id) {
        audioSamples.push(...samples);
        deliveredAudio += samples.length;
        if (samples.length > 0 && !demuxAudio?.description) {
          const sampleEntry = samples[0]?.description as SampleEntryLike | undefined;
          if (demuxAudio) demuxAudio.description = extractAudioDescription(sampleEntry);
        }
        if (deliveredAudio >= expectedAudio) audioDone = true;
        if (expectedAudio > 0) {
          onDemuxProgress(Math.min(0.99, deliveredAudio / expectedAudio));
        }
        if (samples.length >= expectedAudio - (deliveredAudio - samples.length)) {
          audioDone = true;
        }
      }

      finish();
    };

    mp4box.onError = (error: string) => {
      failDemux(
        'unsupported-container',
        `Could not read that MP4: ${error}`,
        'Re-export the file as H.264 MP4 and try again.'
      );
    };

    try {
      const mp4Buffer = buffer as MP4ArrayBuffer;
      mp4Buffer.fileStart = 0;
      mp4box.appendBuffer(mp4Buffer);
      mp4box.flush();
      if (!extractSamples) {
        videoDone = true;
        audioDone = true;
      }
      if (audioTrack && expectedAudio <= 0) audioDone = true;
      finish();
    } catch (error) {
      failDemux(
        'unsupported-container',
        `Could not process that video: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
        'Re-export the file as H.264 MP4 and try again.'
      );
    }
  });
}

function videoDecoderConfig(
  video: DemuxVideoTrack
): VideoDecoderConfig {
  const config: VideoDecoderConfig = {
    codec: video.codec,
    codedWidth: video.codedWidth,
    codedHeight: video.codedHeight,
  };
  if (video.description) {
    config.description = video.description;
  }
  return config;
}

async function chooseH264Codec(
  width: number,
  height: number,
  framerate: number
): Promise<string> {
  if (typeof VideoEncoder === 'undefined') {
    fail(
      'unsupported-codec',
      'This browser does not support video encoding.',
      'Use a recent version of Chrome or Edge.'
    );
  }

  for (const codec of H264_CODECS) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate: 1_000_000,
        framerate,
        bitrateMode: 'variable',
      });
      if (support.supported) return codec;
    } catch {
      // Try the next profile.
    }
  }

  fail(
    'unsupported-codec',
    'No supported H.264 encoder profile was found for this video size.',
    'Try a smaller resolution or use a browser with H.264 encoding support.'
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCapacity(
  decoder: { decodeQueueSize: number },
  encoder: { encodeQueueSize: number }
): Promise<void> {
  while (decoder.decodeQueueSize > MAX_DECODE_QUEUE || encoder.encodeQueueSize > MAX_ENCODE_QUEUE) {
    throwIfCancelled();
    await sleep(4);
  }
  throwIfCancelled();
}

function usFromSample(sample: MP4Sample): number {
  return Math.round((sample.cts / sample.timescale) * 1_000_000);
}

function durationUsFromSample(sample: MP4Sample): number {
  return Math.max(1, Math.round((sample.duration / sample.timescale) * 1_000_000));
}

function downmixToMono(frame: AudioData): AudioData {
  const frameCount = frame.numberOfFrames;
  const channelCount = Math.max(1, frame.numberOfChannels);
  const mixed = new Float32Array(frameCount);
  const plane = new Float32Array(frameCount);

  for (let channel = 0; channel < channelCount; channel += 1) {
    frame.copyTo(plane, { planeIndex: channel, format: 'f32-planar' });
    for (let index = 0; index < frameCount; index += 1) {
      mixed[index] = (mixed[index] ?? 0) + (plane[index] ?? 0) / channelCount;
    }
  }

  return new AudioData({
    format: 'f32-planar',
    sampleRate: frame.sampleRate,
    numberOfFrames: frameCount,
    numberOfChannels: 1,
    timestamp: frame.timestamp,
    data: mixed,
  });
}

async function encodeAudio(
  demux: DemuxResult,
  audioPlan: AudioPlan,
  onProgress: (fraction: number) => void
): Promise<EncodedAudio | null> {
  const audio = demux.audio;
  if (!audio || audioPlan.channels === 0) {
    return null;
  }
  throwIfCancelled();

  if (typeof AudioDecoder === 'undefined' || typeof AudioEncoder === 'undefined') {
    fail(
      'unsupported-audio',
      'This browser does not support audio decoding and encoding.',
      'Use a recent version of Chrome or Edge, or mute the audio.'
    );
  }
  if (demux.audioSamples.length === 0) {
    fail(
      'unsupported-audio',
      'That file has an audio track but no readable audio samples.',
      'Try re-exporting the file, or mute the audio.'
    );
  }
  if (!audio.description) {
    fail(
      'unsupported-audio',
      `The ${audio.codec} audio track is missing its decoder configuration.`,
      'Re-export the audio as AAC, or mute the audio.'
    );
  }
  if (!Number.isFinite(audio.sampleRate) || audio.sampleRate <= 0) {
    fail(
      'unsupported-audio',
      'That audio track has an invalid sample rate.',
      'Re-export the audio as AAC, or mute the audio.'
    );
  }

  const sourceChannels = Math.max(1, Math.round(audio.channels));
  const outputChannels = audioPlan.channels === 1 ? 1 : sourceChannels;
  const decoderConfig: AudioDecoderConfig = {
    codec: audio.codec,
    sampleRate: audio.sampleRate,
    numberOfChannels: sourceChannels,
    description: audio.description,
  };

  try {
    const support = await AudioDecoder.isConfigSupported(decoderConfig);
    if (!support.supported) {
      fail(
        'unsupported-audio',
        `This browser cannot decode the source audio (${audio.codec}).`,
        'Mute the audio or re-export the audio as AAC.'
      );
    }
  } catch (error) {
    if (error instanceof WorkerCompressionError) throw error;
    fail(
      'unsupported-audio',
      `Could not check support for the source audio (${audio.codec}).`,
      'Mute the audio or re-export the audio as AAC.'
    );
  }

  const encoderConfig: AudioEncoderConfig = {
    codec: 'mp4a.40.2',
    sampleRate: audio.sampleRate,
    numberOfChannels: outputChannels,
    bitrate: audioPlan.bitrate,
  };

  try {
    const support = await AudioEncoder.isConfigSupported(encoderConfig);
    if (!support.supported) {
      fail(
        'unsupported-audio',
        'This browser cannot encode AAC audio with these settings.',
        'Mute the audio in Advanced settings, or use a browser that can encode AAC.'
      );
    }
  } catch (error) {
    if (error instanceof WorkerCompressionError) throw error;
    fail(
      'unsupported-audio',
      'Could not check support for AAC audio encoding.',
      'Mute the audio in Advanced settings, or use a browser that can encode AAC.'
    );
  }

  const chunks: EncodedAudioChunk[] = [];
  let metadata: EncodedAudioChunkMetadata | null = null;
  let callbackError: CompressionError | null = null;
  const getCallbackError = (): CompressionError | null => callbackError;
  const audioStartUs = usFromSample(demux.audioSamples[0] as MP4Sample);
  const audioEndUs = audioStartUs + Math.round(demux.durationSeconds * 1_000_000);

  const decoder = new AudioDecoder({
    output: (frame) => {
      if (cancelled || callbackError) {
        frame.close();
        return;
      }
      if (frame.timestamp >= audioEndUs) {
        frame.close();
        return;
      }

      let encodedFrame: AudioData | null = null;
      try {
        encodedFrame =
          outputChannels === 1 && frame.numberOfChannels > 1
            ? downmixToMono(frame)
            : frame;
        encoder.encode(encodedFrame);
      } catch (error) {
        const compressionError = toCompressionError(error);
        callbackError = {
          code: compressionError.code === 'unknown' ? 'encode-failed' : compressionError.code,
          message: `Audio encoding failed: ${compressionError.message}`,
          ...(compressionError.suggestion ? { suggestion: compressionError.suggestion } : {}),
        };
      } finally {
        if (encodedFrame && encodedFrame !== frame) encodedFrame.close();
        frame.close();
      }
    },
    error: (error) => {
      callbackError ??= {
        code: 'decode-failed',
        message: `Audio decoding failed: ${error.message}`,
        suggestion: 'Mute the audio or re-export the audio track and try again.',
      };
    },
  });

  const encoder = new AudioEncoder({
    output: (chunk, chunkMetadata) => {
      if (cancelled || callbackError) return;
      if (!metadata && chunkMetadata) metadata = chunkMetadata;
      if (chunk.timestamp >= audioEndUs) return;

      const remaining = audioEndUs - chunk.timestamp;
      if (chunk.duration !== null && chunk.duration > remaining) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        chunks.push(
          new EncodedAudioChunk({
            type: chunk.type,
            timestamp: chunk.timestamp,
            duration: Math.max(1, remaining),
            data,
          })
        );
      } else {
        chunks.push(chunk);
      }
    },
    error: (error) => {
      callbackError ??= {
        code: 'encode-failed',
        message: `AAC encoding failed: ${error.message}`,
        suggestion: 'Mute the audio in Advanced settings, or use a browser that can encode AAC.',
      };
    },
  });

  try {
    decoder.configure(decoderConfig);
    encoder.configure(encoderConfig);

    const total = demux.audioSamples.length;
    for (let index = 0; index < demux.audioSamples.length; index += 1) {
      throwIfCancelled();
      const pendingError = getCallbackError();
      if (pendingError) {
        throw new WorkerCompressionError(pendingError.code, pendingError.message, pendingError.suggestion);
      }
      const sample = demux.audioSamples[index];
      if (!sample) continue;
      const chunk = new EncodedAudioChunk({
        type: 'key',
        timestamp: usFromSample(sample),
        duration: durationUsFromSample(sample),
        data: sample.data,
      });
      decoder.decode(chunk);
      await waitForCapacity(decoder, encoder);
      onProgress(Math.min(0.99, (index + 1) / total));
    }

    try {
      await decoder.flush();
    } catch (error) {
      const pending = getCallbackError();
      if (pending) {
        throw new WorkerCompressionError(pending.code, pending.message, pending.suggestion);
      }
      throw new WorkerCompressionError(
        'decode-failed',
        `Audio decoding failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        'Mute the audio or re-export the audio track and try again.'
      );
    }
    const decodeError = getCallbackError();
    if (decodeError) {
      throw new WorkerCompressionError(decodeError.code, decodeError.message, decodeError.suggestion);
    }
    try {
      await encoder.flush();
    } catch (error) {
      const pending = getCallbackError();
      if (pending) {
        throw new WorkerCompressionError(pending.code, pending.message, pending.suggestion);
      }
      throw new WorkerCompressionError(
        'encode-failed',
        `Audio encoding failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        'Mute the audio in Advanced settings, or use a browser that can encode AAC.'
      );
    }
    const encodeError = getCallbackError();
    if (encodeError) {
      throw new WorkerCompressionError(encodeError.code, encodeError.message, encodeError.suggestion);
    }
    onProgress(1);
  } catch (error) {
    if (error instanceof WorkerCompressionError || error instanceof CancelledError) throw error;
    throw new WorkerCompressionError(
      'encode-failed',
      `Audio encoding failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      'Mute the audio in Advanced settings, or use a browser that can encode AAC.'
    );
  } finally {
    try {
      decoder.close();
    } catch {
      // already closed
    }
    try {
      encoder.close();
    } catch {
      // already closed
    }
  }

  return {
    chunks,
    metadata,
    sampleRate: audio.sampleRate,
    channels: outputChannels,
    bitrate: audioPlan.bitrate,
  };
}

async function encodeAttempt(
  demux: DemuxResult,
  plan: AttemptPlan,
  rotation: Rotation,
  codec: string,
  audio: EncodedAudio | null,
  onProgress: (fraction: number, processedFrames: number, totalFrames: number) => void
): Promise<AttemptOutput> {
  throwIfCancelled();

  const target = new ArrayBufferTarget();
  let muxer: Muxer<ArrayBufferTarget>;
  try {
    muxer = audio
      ? new Muxer({
          target,
          video: { codec: 'avc', width: plan.width, height: plan.height },
          audio: {
            codec: 'aac',
            numberOfChannels: audio.channels,
            sampleRate: audio.sampleRate,
          },
          fastStart: 'in-memory',
          firstTimestampBehavior: 'cross-track-offset',
        })
      : new Muxer({
          target,
          video: { codec: 'avc', width: plan.width, height: plan.height },
          fastStart: 'in-memory',
          firstTimestampBehavior: 'cross-track-offset',
        });
  } catch (error) {
    fail(
      'mux-failed',
      `Could not create the MP4 muxer: ${error instanceof Error ? error.message : 'unknown error'}`,
      'Try a different resolution or refresh the page.'
    );
  }

  const canvas = new OffscreenCanvas(plan.width, plan.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    fail(
      'encode-failed',
      'Could not create a drawing surface for video scaling.',
      'Try a smaller resolution or use a different browser.'
    );
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const rotationAngle = rotationRadians(rotation);

  let callbackError: CompressionError | null = null;
  let muxError: Error | null = null;
  const getCallbackError = (): CompressionError | null => callbackError;
  const getMuxError = (): Error | null => muxError;
  let processedFrames = 0;
  let firstFrameTimestamp: number | null = null;
  let lastKeptIndex = -1;
  let lastKeyframeTimestamp: number | null = null;
  const totalFrames = demux.videoSamples.length;
  const keyframeIntervalUs = ENCODING.KEYFRAME_INTERVAL_SECONDS * 1_000_000;
  const shouldDropFrames = plan.fps < demux.sourceFps - 0.01;
  const scale = demux.video.displayHeight > 0 ? plan.height / demux.video.displayHeight : 1;

  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      if (cancelled || callbackError) return;
      try {
        if (metadata) {
          muxer.addVideoChunk(chunk, metadata);
        } else {
          muxer.addVideoChunk(chunk);
        }
      } catch (error) {
        muxError = error instanceof Error ? error : new Error(String(error));
      }
    },
    error: (error) => {
      callbackError ??= {
        code: 'encode-failed',
        message: `Video encoding failed: ${error.message}`,
        suggestion: 'Try a lower resolution, a larger target size, or a different browser.',
      };
    },
  });

  const decoder = new VideoDecoder({
    output: (frame) => {
      if (cancelled || callbackError) {
        frame.close();
        return;
      }

      try {
        if (firstFrameTimestamp === null) firstFrameTimestamp = frame.timestamp;

        if (shouldDropFrames) {
          const frameIndex = Math.round(
            ((frame.timestamp - firstFrameTimestamp) * plan.fps) / 1_000_000
          );
          if (frameIndex <= lastKeptIndex) {
            processedFrames += 1;
            onProgress(Math.min(0.98, processedFrames / Math.max(1, totalFrames)), processedFrames, totalFrames);
            frame.close();
            return;
          }
          lastKeptIndex = frameIndex;
        }

        const drawWidth = frame.displayWidth * scale;
        const drawHeight = frame.displayHeight * scale;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = '#000';
        context.fillRect(0, 0, plan.width, plan.height);
        context.save();
        context.translate(plan.width / 2, plan.height / 2);
        if (rotationAngle !== 0) context.rotate(rotationAngle);
        context.drawImage(frame, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        context.restore();

        const frameInit: VideoFrameInit = { timestamp: frame.timestamp };
        if (frame.duration !== null && frame.duration > 0) {
          frameInit.duration = frame.duration;
        }
        const outputFrame = new VideoFrame(canvas, frameInit);
        const keyFrame =
          lastKeyframeTimestamp === null ||
          frame.timestamp - lastKeyframeTimestamp >= keyframeIntervalUs;
        if (keyFrame) lastKeyframeTimestamp = frame.timestamp;

        encoder.encode(outputFrame, { keyFrame });
        outputFrame.close();
        processedFrames += 1;
        onProgress(Math.min(0.98, processedFrames / Math.max(1, totalFrames)), processedFrames, totalFrames);
      } catch (error) {
        const compressionError = toCompressionError(error);
        callbackError ??= {
          code: compressionError.code === 'unknown' ? 'encode-failed' : compressionError.code,
          message: `Frame processing failed: ${compressionError.message}`,
          ...(compressionError.suggestion ? { suggestion: compressionError.suggestion } : {}),
        };
      } finally {
        frame.close();
      }
    },
    error: (error) => {
      callbackError ??= {
        code: 'decode-failed',
        message: `Video decoding failed: ${error.message}`,
        suggestion: 'Re-export the source as H.264 MP4 and try again.',
      };
    },
  });

  try {
    decoder.configure(videoDecoderConfig(demux.video));
    encoder.configure({
      codec,
      width: plan.width,
      height: plan.height,
      bitrate: plan.videoBitrate,
      framerate: plan.fps,
      bitrateMode: 'variable',
    });

    for (const sample of demux.videoSamples) {
      throwIfCancelled();
      const pendingError = getCallbackError();
      if (pendingError) {
        throw new WorkerCompressionError(pendingError.code, pendingError.message, pendingError.suggestion);
      }
      const pendingMuxError = getMuxError();
      if (pendingMuxError) {
        throw new WorkerCompressionError('mux-failed', `MP4 muxing failed: ${pendingMuxError.message}`);
      }
      const chunk = new EncodedVideoChunk({
        type: sample.is_sync ? 'key' : 'delta',
        timestamp: usFromSample(sample),
        duration: durationUsFromSample(sample),
        data: sample.data,
      });
      decoder.decode(chunk);
      await waitForCapacity(decoder, encoder);
    }

    try {
      await decoder.flush();
    } catch (error) {
      const pending = getCallbackError();
      if (pending) {
        throw new WorkerCompressionError(pending.code, pending.message, pending.suggestion);
      }
      throw new WorkerCompressionError(
        'decode-failed',
        `Video decoding failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        'Re-export the source as H.264 MP4 and try again.'
      );
    }
    const decodeError = getCallbackError();
    if (decodeError) {
      throw new WorkerCompressionError(decodeError.code, decodeError.message, decodeError.suggestion);
    }
    try {
      await encoder.flush();
    } catch (error) {
      const pending = getCallbackError();
      if (pending) {
        throw new WorkerCompressionError(pending.code, pending.message, pending.suggestion);
      }
      throw new WorkerCompressionError(
        'encode-failed',
        `Video encoding failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        'Try a lower resolution, a larger target size, or a different browser.'
      );
    }
    const encodeError = getCallbackError();
    if (encodeError) {
      throw new WorkerCompressionError(encodeError.code, encodeError.message, encodeError.suggestion);
    }
    const muxFailure = getMuxError();
    if (muxFailure) {
      throw new WorkerCompressionError('mux-failed', `MP4 muxing failed: ${muxFailure.message}`);
    }

    onProgress(1, processedFrames, totalFrames);

    try {
      if (audio) {
        for (const chunk of audio.chunks) {
          throwIfCancelled();
          if (audio.metadata) {
            muxer.addAudioChunk(chunk, audio.metadata);
          } else {
            muxer.addAudioChunk(chunk);
          }
        }
      }

      muxer.finalize();
    } catch (error) {
      if (error instanceof CancelledError) throw error;
      throw new WorkerCompressionError(
        'mux-failed',
        `MP4 muxing failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        'Try a different resolution or target size.'
      );
    }

    const outputBuffer = target.buffer;
    if (!outputBuffer || outputBuffer.byteLength === 0) {
      fail('mux-failed', 'The MP4 muxer produced an empty file.', 'Try a different resolution or target size.');
    }

    return { buffer: outputBuffer, size: outputBuffer.byteLength, plan };
  } catch (error) {
    if (error instanceof WorkerCompressionError || error instanceof CancelledError) throw error;
    throw new WorkerCompressionError(
      'encode-failed',
      `Video encoding failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      'Try a lower resolution, a larger target size, or a different browser.'
    );
  } finally {
    try {
      decoder.close();
    } catch {
      // already closed
    }
    try {
      encoder.close();
    } catch {
      // already closed
    }
    canvas.width = 1;
    canvas.height = 1;
  }
}

function rotationRadians(rotation: Rotation): number {
  if (rotation === 90) return Math.PI / 2;
  if (rotation === 180) return Math.PI;
  if (rotation === 270) return (3 * Math.PI) / 2;
  return 0;
}

interface PlannedAttempt {
  plan: AttemptPlan;
  rotation: Rotation;
}

function makeAttempt(
  encodingPlan: EncodingPlan,
  levelIndex: number,
  fps: number,
  videoBitrate: number
): PlannedAttempt {
  return {
    plan: createAttemptPlan(encodingPlan, levelIndex, fps, videoBitrate),
    rotation: encodingPlan.rotation,
  };
}

async function compressVideo(
  fileBuffer: ArrayBuffer,
  filename: string,
  settings: CompressionSettings
): Promise<void> {
  const startedAt = performance.now();
  const preset = QUALITY_PRESETS[settings.preset] ?? QUALITY_PRESETS.balanced;
  const resolved = resolveSettings(settings, preset);
  const passCount = resolved.maxPasses;
  const tolerance = resolved.tolerance;

  if (!Number.isFinite(settings.targetSizeBytes) || settings.targetSizeBytes <= 0) {
    fail(
      'target-too-small',
      'The target size must be greater than zero.',
      'Pick a larger target size and try again.'
    );
  }
  if (fileBuffer.byteLength > FILE_LIMITS.MAX_FILE_SIZE) {
    fail(
      'file-too-large',
      'That file is larger than the 2 GB in-browser limit.',
      'Use a shorter clip or a smaller file.'
    );
  }

  const container = detectContainer(fileBuffer);
  if (!container) {
    fail(
      'unsupported-container',
      'That file is not an MP4, MOV or M4V video.',
      'Convert it to H.264 MP4 first, then try again.'
    );
  }

  let lastOverall = 0;
  let lastProgressAt = 0;
  let currentWidth = 0;
  let currentHeight = 0;
  let currentFps = 0;
  let currentPass = 0;

  const emit = (partial: Partial<CompressionProgress> & { progress: number }): void => {
    const overall = Math.max(lastOverall, Math.min(100, partial.progress));
    lastOverall = overall;
    const progress: CompressionProgress = {
      stage: 'encoding',
      pass: currentPass,
      passCount,
      passProgress: 0,
      processedFrames: 0,
      totalFrames: 0,
      width: currentWidth,
      height: currentHeight,
      fps: currentFps,
      elapsedMs: performance.now() - startedAt,
      etaMs: null,
      message: '',
      ...partial,
      progress: overall,
    };
    postMessage({ type: 'progress', progress });
  };

  emit({ stage: 'reading', progress: 1, message: 'Reading video file' });
  throwIfCancelled();

  const skipEncoding = settings.targetSizeBytes >= fileBuffer.byteLength;
  if (skipEncoding) {
    const demux = await demuxMp4(fileBuffer, filename, container, false, () => {
      emit({ stage: 'demuxing', progress: 4, message: 'Reading video tracks' });
    });
    throwIfCancelled();
    currentWidth = demux.metadata.width;
    currentHeight = demux.metadata.height;
    currentFps = demux.metadata.fps;
    emit({ stage: 'finalizing', progress: 100, width: currentWidth, height: currentHeight, fps: currentFps, message: 'Target is larger than the source; keeping the original file' });

    const classification = classifyResult(fileBuffer.byteLength, settings.targetSizeBytes, tolerance);
    const report: CompressionReport = {
      targetBytes: settings.targetSizeBytes,
      outputBytes: fileBuffer.byteLength,
      originalBytes: fileBuffer.byteLength,
      durationSeconds: demux.durationSeconds,
      width: demux.metadata.width,
      height: demux.metadata.height,
      fps: demux.metadata.fps,
      videoCodec: demux.metadata.videoCodec,
      audioCodec: demux.metadata.audioCodec,
      audioBitrate: null,
      audioChannels: demux.metadata.audioChannels ?? 0,
      passes: 0,
      elapsedMs: performance.now() - startedAt,
      hitTarget: classification.hitTarget,
      overTarget: classification.overTarget,
      withinTolerance: classification.withinTolerance,
      targetDeltaRatio: classification.targetDeltaRatio,
      resolutionReduced: false,
      fpsReduced: false,
      skipped: true,
    };

    const containerMime =
      container === 'mov' ? 'video/quicktime' : container === 'm4v' ? 'video/x-m4v' : 'video/mp4';
    postMessage({
      type: 'complete',
      result: {
        success: true,
        blob: new Blob([fileBuffer], { type: containerMime }),
        report,
      },
    });
    return;
  }

  const demux = await demuxMp4(fileBuffer, filename, container, true, (fraction) => {
    emit({
      stage: 'demuxing',
      progress: 2 + fraction * 3,
      message: 'Reading video tracks',
    });
  });
  throwIfCancelled();

  currentWidth = demux.metadata.width;
  currentHeight = demux.metadata.height;
  currentFps = demux.metadata.fps;
  emit({
    stage: 'demuxing',
    progress: 6,
    width: currentWidth,
    height: currentHeight,
    fps: currentFps,
    message: 'Tracks ready',
  });

  if (demux.videoSamples.length === 0) {
    fail(
      'unsupported-codec',
      'That file has no decodable video samples.',
      'Re-export the video as H.264 MP4 and try again.'
    );
  }

  const encodingPlan = createEncodingPlan(
    demux.metadata,
    settings,
    passCount,
    tolerance,
    preset.autoDownscale
  );

  if (typeof VideoDecoder === 'undefined') {
    fail(
      'unsupported-codec',
      'This browser does not support video decoding.',
      'Use a recent version of Chrome or Edge.'
    );
  }

  const decoderConfig = videoDecoderConfig(demux.video);
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig);
    if (!support.supported) {
      fail(
        'unsupported-codec',
        `This browser cannot decode the source video (${demux.video.codec}).`,
        'Re-export the video as H.264 MP4, or use a browser that supports this codec.'
      );
    }
  } catch (error) {
    if (error instanceof WorkerCompressionError) throw error;
    fail(
      'unsupported-codec',
      `Could not check support for the source video (${demux.video.codec}).`,
      'Re-export the video as H.264 MP4 and try again.'
    );
  }

  const maxLevel = encodingPlan.levels.reduce<ResolutionLevel>(
    (largest, level) => (level.height > largest.height ? level : largest),
    encodingPlan.levels[0] ?? {
      width: demux.video.displayWidth,
      height: demux.video.displayHeight,
      sourceHeight: demux.video.displayHeight,
    }
  );
  const maxFps = Math.max(encodingPlan.initialFps, AUTO_FPS_FALLBACK);
  const codec = await chooseH264Codec(maxLevel.width, maxLevel.height, maxFps);

  let audio: EncodedAudio | null = null;
  if (encodingPlan.audio.channels > 0 && demux.audio) {
    emit({
      stage: 'encoding',
      progress: 7,
      width: currentWidth,
      height: currentHeight,
      fps: currentFps,
      message: 'Encoding audio',
    });
    audio = await encodeAudio(demux, encodingPlan.audio, (fraction) => {
      emit({
        stage: 'encoding',
        progress: 7 + fraction * 8,
        width: currentWidth,
        height: currentHeight,
        fps: currentFps,
        message: 'Encoding audio',
      });
    });
    throwIfCancelled();
  }

  const passSpan = 76 / passCount;
  const passBase = 16;
  let attempt = 1;
  let levelIndex = encodingPlan.initialLevelIndex;
  let fps = encodingPlan.initialFps;
  let videoBitrate = encodingPlan.initialVideoBitrate;
  let lastOutput: AttemptOutput | null = null;
  let finalAttemptPlan: AttemptPlan | null = null;
  let completedPasses = 0;

  while (attempt <= passCount) {
    throwIfCancelled();
    currentPass = attempt;
    const plannedAttempt = makeAttempt(encodingPlan, levelIndex, fps, videoBitrate);
    const plan = plannedAttempt.plan;
    const base = passBase + (attempt - 1) * passSpan;
    const attemptStartedAt = performance.now();

    emit({
      stage: 'encoding',
      progress: base,
      pass: attempt,
      passProgress: 0,
      width: plan.width,
      height: plan.height,
      fps: plan.fps,
      currentBitrate: plan.videoBitrate,
      message: attempt === 1 ? 'Encoding video' : 'Refining compression',
    });

    const output = await encodeAttempt(
      demux,
      plan,
      plannedAttempt.rotation,
      codec,
      audio,
      (fraction, processed, total) => {
      const now = performance.now();
      const passProgress = Math.max(0, Math.min(1, fraction));
      const overall = base + passSpan * passProgress * 0.94;
      if (now - lastProgressAt >= 100 || passProgress >= 1) {
        lastProgressAt = now;
        const perFrame = processed > 0 ? (now - attemptStartedAt) / processed : 0;
        const etaMs =
          perFrame > 0 && total > processed
            ? Math.round(perFrame * (total - processed))
            : null;
        emit({
          stage: 'encoding',
          progress: overall,
          pass: attempt,
          passProgress,
          processedFrames: processed,
          totalFrames: total,
          width: plan.width,
          height: plan.height,
          fps: plan.fps,
          currentBitrate: plan.videoBitrate,
          etaMs,
          message: attempt === 1 ? 'Encoding video' : 'Refining compression',
        });
      }
    });

    throwIfCancelled();
    lastOutput = output;
    finalAttemptPlan = plan;
    completedPasses = attempt;

    emit({
      stage: 'encoding',
      progress: base + passSpan * 0.99,
      pass: attempt,
      passProgress: 1,
      width: plan.width,
      height: plan.height,
      fps: plan.fps,
      currentBitrate: plan.videoBitrate,
      processedFrames: demux.videoSamples.length,
      totalFrames: demux.videoSamples.length,
      message: 'Checking output size',
    });

    const classification = classifyResult(output.size, settings.targetSizeBytes, tolerance);
    const withinTolerance = classification.withinTolerance;
    if (withinTolerance || attempt >= passCount) break;

    const nextBitrate = correctVideoBitrate(
      plan.videoBitrate,
      output.size,
      settings.targetSizeBytes,
      demux.durationSeconds
    );
    const nextLevelFloor = minVideoBitrateForHeight(plan.height);
    let nextLevelIndex = levelIndex;
    let nextFps = fps;
    let nextVideoBitrate = nextBitrate;

    if (
      nextBitrate < nextLevelFloor &&
      encodingPlan.autoDownscale &&
      levelIndex < encodingPlan.levels.length - 1
    ) {
      let candidateIndex = levelIndex + 1;
      while (candidateIndex < encodingPlan.levels.length - 1) {
        const candidate = encodingPlan.levels[candidateIndex];
        if (!candidate || nextBitrate >= minVideoBitrateForHeight(candidate.height)) break;
        candidateIndex += 1;
      }
      nextLevelIndex = candidateIndex;
      nextVideoBitrate = Math.max(nextBitrate, ENCODING.MIN_VIDEO_BITRATE);
    } else if (
      classification.overTarget &&
      nextLevelIndex === encodingPlan.levels.length - 1 &&
      nextFps > AUTO_FPS_FALLBACK &&
      encodingPlan.fpsMode === 'auto' &&
      demux.sourceFps > AUTO_FPS_FALLBACK
    ) {
      nextFps = reduceFpsForTarget(
        encodingPlan.fpsMode,
        nextFps,
        demux.sourceFps,
        nextVideoBitrate,
        plan.height
      );
    }

    if (
      nextBitrate === plan.videoBitrate &&
      nextLevelIndex === levelIndex &&
      nextFps === fps
    ) {
      nextVideoBitrate = Math.max(
        ENCODING.MIN_VIDEO_BITRATE,
        Math.round(nextBitrate * (classification.overTarget ? 0.97 : 1.05))
      );
    }

    levelIndex = nextLevelIndex;
    fps = nextFps;
    videoBitrate = nextVideoBitrate;
    attempt += 1;
  }

  throwIfCancelled();
  if (!lastOutput || !finalAttemptPlan) {
    fail(
      'encode-failed',
      'Compression ended without producing a file.',
      'Try again with a different target size or resolution.'
    );
  }

  emit({
    stage: 'finalizing',
    progress: 92,
    pass: completedPasses,
    passProgress: 1,
    width: finalAttemptPlan.width,
    height: finalAttemptPlan.height,
    fps: finalAttemptPlan.fps,
    currentBitrate: finalAttemptPlan.videoBitrate,
    message: 'Finalizing MP4',
  });

  const classification = classifyResult(lastOutput.size, settings.targetSizeBytes, tolerance);
  const outputHeight = finalAttemptPlan.height;
  const outputFps = finalAttemptPlan.fps;
  const report: CompressionReport = {
    targetBytes: settings.targetSizeBytes,
    outputBytes: lastOutput.size,
    originalBytes: fileBuffer.byteLength,
    durationSeconds: demux.durationSeconds,
    width: finalAttemptPlan.width,
    height: finalAttemptPlan.height,
    fps: outputFps,
    videoCodec: codec,
    audioCodec: audio ? 'aac' : null,
    audioBitrate: audio ? audio.bitrate : null,
    audioChannels: audio ? audio.channels : 0,
    passes: completedPasses,
    elapsedMs: performance.now() - startedAt,
    hitTarget: classification.hitTarget,
    overTarget: classification.overTarget,
    withinTolerance: classification.withinTolerance,
    targetDeltaRatio: classification.targetDeltaRatio,
    resolutionReduced: outputHeight < demux.video.displayHeight - 1,
    fpsReduced: outputFps < demux.sourceFps - 0.01,
    skipped: false,
  };

  emit({
    stage: 'finalizing',
    progress: 100,
    pass: report.passes,
    width: report.width,
    height: report.height,
    fps: report.fps,
    currentBitrate: finalAttemptPlan.videoBitrate,
    message: 'MP4 ready',
  });

  postMessage({
    type: 'complete',
    result: {
      success: true,
      blob: new Blob([lastOutput.buffer], { type: 'video/mp4' }),
      report,
    },
  });
}
