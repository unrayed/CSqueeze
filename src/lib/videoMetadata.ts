import type { VideoMetadata } from '../types';
import type { MP4File } from 'mp4box';

// Declare global MP4Box from script loaded in index.html
declare global {
  interface Window {
    MP4Box: {
      createFile: () => MP4File;
    };
  }
}

/**
 * Extract video metadata using mp4box.js
 */
export async function extractVideoMetadata(
  file: File | ArrayBuffer,
  filename?: string
): Promise<VideoMetadata> {
  if (!window.MP4Box) {
    throw new Error('MP4Box not loaded. Please refresh the page.');
  }
  const mp4box = window.MP4Box.createFile();

  return new Promise((resolve, reject) => {
    let fileSize: number;
    let buffer: ArrayBuffer;
    let resolvedFilename: string;

    if (file instanceof File) {
      fileSize = file.size;
      resolvedFilename = file.name;
    } else {
      buffer = file;
      fileSize = file.byteLength;
      resolvedFilename = filename ?? 'video.mp4';
    }

    mp4box.onReady = (info) => {
      const videoTrack = info.videoTracks[0];
      const audioTrack = info.audioTracks[0];

      if (!videoTrack) {
        reject(new Error('No video track found in file'));
        return;
      }

      // Calculate FPS from timescale and sample count
      const duration = info.duration / info.timescale;
      const fps = videoTrack.nb_samples / duration || 30;

      const metadata: VideoMetadata = {
        filename: resolvedFilename,
        fileSize,
        duration,
        width: videoTrack.video.width,
        height: videoTrack.video.height,
        fps: Math.round(fps * 100) / 100,
        videoCodec: videoTrack.codec,
        audioCodec: audioTrack?.codec ?? null,
        hasAudio: !!audioTrack,
      };

      resolve(metadata);
    };

    mp4box.onError = (e: string) => {
      reject(new Error(`Failed to parse video: ${e}`));
    };

    const processBuffer = (arrayBuffer: ArrayBuffer) => {
      // mp4box requires fileStart property on the buffer
      const mp4Buffer = arrayBuffer as ArrayBuffer & { fileStart: number };
      mp4Buffer.fileStart = 0;
      
      try {
        mp4box.appendBuffer(mp4Buffer);
        mp4box.flush();
      } catch (e) {
        reject(new Error(`Failed to process video: ${e instanceof Error ? e.message : 'Unknown error'}`));
      }
    };

    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          processBuffer(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    } else {
      processBuffer(buffer!);
    }
  });
}

/**
 * Get video duration using HTML5 video element (fallback method)
 */
export function getVideoDurationFromElement(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a thumbnail from a video file
 */
export function generateVideoThumbnail(
  file: File,
  timeSeconds = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };

    video.src = URL.createObjectURL(file);
  });
}
