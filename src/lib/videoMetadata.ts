import { createFile } from 'mp4box';
import type { MP4ArrayBuffer, MP4AudioTrack, MP4Info, MP4VideoTrack } from 'mp4box';
import type { CompressionErrorCode, Rotation, VideoMetadata } from '../types';
import { detectContainer, displayDimensions, rotationFromMatrix } from './media';

const METADATA_TIMEOUT_MS = 15_000;
const THUMBNAIL_TIMEOUT_MS = 12_000;
const THUMBNAIL_MAX_TIME = 1;

export class VideoMetadataError extends Error {
  readonly code: CompressionErrorCode;
  readonly suggestion?: string;

  constructor(code: CompressionErrorCode, message: string, suggestion?: string) {
    super(message);
    this.name = 'VideoMetadataError';
    this.code = code;
    if (suggestion !== undefined) {
      this.suggestion = suggestion;
    }
  }
}

interface VideoTrackWithMatrix extends MP4VideoTrack {
  matrix?: number[];
  samples_duration?: number;
}

function readFileBuffer(file: File | ArrayBuffer): Promise<ArrayBuffer> {
  if (file instanceof ArrayBuffer) return Promise.resolve(file);
  return file.arrayBuffer();
}

export async function extractVideoMetadata(
  file: File | ArrayBuffer,
  filename?: string
): Promise<VideoMetadata> {
  let buffer: ArrayBuffer;
  try {
    buffer = await readFileBuffer(file);
  } catch {
    throw new VideoMetadataError(
      'read-failed',
      'Could not read that file.',
      'Make sure the file still exists and try selecting it again.'
    );
  }

  const container = detectContainer(buffer);
  if (!container) {
    throw new VideoMetadataError(
      'unsupported-container',
      'That file is not an MP4, MOV or M4V video.',
      'Convert it to MP4 (H.264) first, then try again.'
    );
  }

  const resolvedFilename = file instanceof File ? file.name : filename ?? 'video.mp4';
  const fileSize = buffer.byteLength;

  return new Promise<VideoMetadata>((resolve, reject) => {
    const mp4box = createFile();
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

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

    const fail = (error: VideoMetadataError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const succeed = (metadata: VideoMetadata) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(metadata);
    };

    timeout = setTimeout(() => {
      fail(
        new VideoMetadataError(
          'unsupported-container',
          'Reading the video metadata timed out.',
          'Try a shorter clip or re-export the file as a standard MP4.'
        )
      );
    }, METADATA_TIMEOUT_MS);

    mp4box.onReady = (info: MP4Info) => {
      const videoTrack = info.videoTracks[0] as VideoTrackWithMatrix | undefined;
      if (!videoTrack) {
        fail(
          new VideoMetadataError(
            'unsupported-codec',
            'That file has no video track.',
            'Pick a file that contains a video stream.'
          )
        );
        return;
      }

      const audioTrack = info.audioTracks[0] as MP4AudioTrack | undefined;
      const rotation = rotationFromMatrix(videoTrack.matrix);
      const display = displayDimensions(
        videoTrack.video.width,
        videoTrack.video.height,
        rotation
      );
      const trackDuration =
        videoTrack.duration > 0 && videoTrack.timescale > 0
          ? videoTrack.duration / videoTrack.timescale
          : info.duration / info.timescale;
      const duration = Number.isFinite(trackDuration) && trackDuration > 0 ? trackDuration : 0;
      const rawFps = duration > 0 ? videoTrack.nb_samples / duration : 0;
      const fps = Number.isFinite(rawFps) && rawFps > 0 ? Math.min(240, rawFps) : 30;

      succeed({
        filename: resolvedFilename,
        fileSize,
        duration,
        width: display.width,
        height: display.height,
        fps: Math.round(fps * 1000) / 1000,
        videoCodec: videoTrack.codec,
        audioCodec: audioTrack?.codec ?? null,
        hasAudio: Boolean(audioTrack),
        audioChannels: audioTrack?.audio.channel_count ?? null,
        audioSampleRate: audioTrack?.audio.sample_rate ?? null,
        rotation,
        container,
      });
    };

    mp4box.onError = (error: string) => {
      fail(
        new VideoMetadataError(
          'unsupported-container',
          `Could not read that video: ${error}`,
          'Re-export it as H.264 MP4 and try again.'
        )
      );
    };

    try {
      const mp4Buffer = buffer as MP4ArrayBuffer;
      mp4Buffer.fileStart = 0;
      mp4box.appendBuffer(mp4Buffer);
      mp4box.flush();
    } catch (error) {
      fail(
        new VideoMetadataError(
          'unsupported-container',
          `Could not read that video: ${error instanceof Error ? error.message : 'unknown error'}`,
          'Re-export it as H.264 MP4 and try again.'
        )
      );
    }
  });
}

export function getVideoDurationFromElement(file: File): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new VideoMetadataError('read-failed', 'Reading the video duration timed out.'));
    }, METADATA_TIMEOUT_MS);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (settled) return;
      settled = true;
      const duration = video.duration;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new VideoMetadataError('unsupported-codec', 'Could not read the video duration.'));
    };
    video.src = objectUrl;
  });
}

export function generateVideoThumbnail(
  file: File,
  timeSeconds = 0
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    let seekRequested = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    const fail = (error: VideoMetadataError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    timeout = setTimeout(() => {
      fail(new VideoMetadataError('read-failed', 'Generating the video thumbnail timed out.'));
    }, THUMBNAIL_TIMEOUT_MS);

    if (!context) {
      fail(new VideoMetadataError('unknown', 'Could not create a thumbnail canvas.'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const targetTime = Math.min(Math.max(0, timeSeconds), Math.max(0, duration - 0.05));
      try {
        video.currentTime = duration > 0 ? Math.min(targetTime, THUMBNAIL_MAX_TIME) : 0;
      } catch {
        fail(new VideoMetadataError('read-failed', 'Could not seek the video thumbnail.'));
      }
    };

    video.onseeked = () => {
      if (settled || seekRequested) return;
      seekRequested = true;
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width <= 0 || height <= 0) {
          fail(new VideoMetadataError('read-failed', 'That video has no visible frames.'));
          return;
        }
        const maxWidth = 640;
        const scale = Math.min(1, maxWidth / width);
        canvas.width = Math.max(2, Math.round(width * scale));
        canvas.height = Math.max(2, Math.round(height * scale));
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              fail(new VideoMetadataError('unknown', 'Could not encode the video thumbnail.'));
              return;
            }
            const thumbnailUrl = URL.createObjectURL(blob);
            if (settled) {
              URL.revokeObjectURL(thumbnailUrl);
              return;
            }
            settled = true;
            cleanup();
            resolve(thumbnailUrl);
          },
          'image/jpeg',
          0.82
        );
      } catch (error) {
        fail(
          new VideoMetadataError(
            'unknown',
            `Could not generate the video thumbnail: ${error instanceof Error ? error.message : 'unknown error'}`
          )
        );
      }
    };

    video.onerror = () => {
      fail(new VideoMetadataError('unsupported-codec', 'Could not decode that video for a thumbnail.'));
    };

    video.src = objectUrl;
  });
}

export function rotationLabel(rotation: Rotation): string {
  return rotation === 0 ? '0°' : `${rotation}°`;
}
