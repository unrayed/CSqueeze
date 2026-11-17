export type QualityPreset = 'fast' | 'balanced' | 'best';

export type ResolutionCap = 'auto' | 'source' | 1080 | 720 | 480 | 360 | 240;

export type FpsCap = 'auto' | 'source' | 60 | 30 | 24;

export type AudioKbps = 'auto' | 64 | 96 | 128 | 192;

export type Rotation = 0 | 90 | 180 | 270;

export interface VideoMetadata {
  filename: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  hasAudio: boolean;
  audioChannels: number | null;
  audioSampleRate: number | null;
  rotation: Rotation;
  container: string;
}

export interface CompressionSettings {
  targetSizeBytes: number;
  preset: QualityPreset;
  resolution: ResolutionCap;
  fps: FpsCap;
  audioKbps: AudioKbps;
  muteAudio: boolean;
  toleranceOverride?: number;
  passesOverride?: number;
}

export interface EncodingParams {
  videoBitrate: number;
  audioBitrate: number;
  width: number;
  height: number;
  fps: number;
  muteAudio: boolean;
}

export type CompressionStage =
  | 'idle'
  | 'reading'
  | 'demuxing'
  | 'encoding'
  | 'finalizing'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface CompressionProgress {
  stage: CompressionStage;
  progress: number;
  pass: number;
  passCount: number;
  passProgress: number;
  processedFrames: number;
  totalFrames: number;
  currentBitrate?: number;
  width: number;
  height: number;
  fps: number;
  elapsedMs: number;
  etaMs: number | null;
  message: string;
}

export type CompressionErrorCode =
  | 'unsupported-container'
  | 'unsupported-codec'
  | 'unsupported-audio'
  | 'decode-failed'
  | 'encode-failed'
  | 'mux-failed'
  | 'target-too-small'
  | 'memory'
  | 'file-too-large'
  | 'read-failed'
  | 'cancelled'
  | 'unknown';

export interface CompressionError {
  code: CompressionErrorCode;
  message: string;
  suggestion?: string;
}

export type AudioEncoderKind = 'webcodecs' | 'fdk-wasm';

export interface CompressionReport {
  targetBytes: number;
  outputBytes: number;
  originalBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  audioBitrate: number | null;
  audioChannels: number;
  audioEncoder: AudioEncoderKind | null;
  passes: number;
  elapsedMs: number;
  hitTarget: boolean;
  overTarget: boolean;
  withinTolerance: boolean;
  targetDeltaRatio: number;
  resolutionReduced: boolean;
  fpsReduced: boolean;
  skipped: boolean;
}

export interface CompressionResult {
  success: boolean;
  blob?: Blob;
  report?: CompressionReport;
  error?: CompressionError;
}

export type WorkerInputMessage =
  | {
      type: 'compress';
      file: ArrayBuffer;
      filename: string;
      settings: CompressionSettings;
    }
  | {
      type: 'cancel';
    };

export type WorkerOutputMessage =
  | {
      type: 'progress';
      progress: CompressionProgress;
    }
  | {
      type: 'complete';
      result: CompressionResult;
    }
  | {
      type: 'cancelled';
    }
  | {
      type: 'error';
      error: CompressionError;
    };

export interface SizePreset {
  label: string;
  bytes: number;
  description: string;
}

export interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
}
