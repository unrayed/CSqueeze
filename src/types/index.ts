// Video metadata extracted from input file
export interface VideoMetadata {
  filename: string;
  fileSize: number;
  duration: number; // seconds
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  hasAudio: boolean;
}

// Compression settings from user
export interface CompressionSettings {
  targetSizeBytes: number;
  audioBitrate: number; // bits per second (e.g., 96000 or 128000)
  targetResolution: number | null; // null = keep original, otherwise target height (720, 480, etc.)
  muteAudio: boolean;
}

// Internal encoding parameters computed from settings
export interface EncodingParams {
  videoBitrate: number; // bits per second
  audioBitrate: number; // bits per second
  width: number;
  height: number;
  fps: number;
  muteAudio: boolean;
}

// Progress stages during compression
export type CompressionStage =
  | 'idle'
  | 'reading'
  | 'analyzing'
  | 'encoding'
  | 'retrying'
  | 'finalizing'
  | 'complete'
  | 'error'
  | 'cancelled';

// Progress update from worker
export interface CompressionProgress {
  stage: CompressionStage;
  progress: number; // 0-100
  currentAttempt: number;
  maxAttempts: number;
  message: string;
  currentBitrate?: number;
  estimatedSize?: number;
}

// Final compression result
export interface CompressionResult {
  success: boolean;
  blob?: Blob;
  outputSize?: number;
  originalSize: number;
  duration: number;
  encodingTime: number; // milliseconds
  attempts: number;
  finalBitrate?: number;
  error?: string;
  suggestion?: string;
}

// Messages sent to worker
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

// Messages received from worker
export type WorkerOutputMessage =
  | {
      type: 'metadata';
      metadata: VideoMetadata;
    }
  | {
      type: 'progress';
      progress: CompressionProgress;
    }
  | {
      type: 'complete';
      result: CompressionResult;
    }
  | {
      type: 'error';
      error: string;
      suggestion?: string;
    };

// Preset target sizes
export interface SizePreset {
  label: string;
  bytes: number;
  description: string;
}

// Resolution steps for downscaling
export interface ResolutionStep {
  name: string;
  maxHeight: number;
}
