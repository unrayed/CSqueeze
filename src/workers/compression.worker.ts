/// <reference lib="webworker" />

import type { MP4File, MP4Info, MP4Sample, MP4ArrayBuffer } from 'mp4box';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// MP4Box will be loaded dynamically
let MP4Box: { createFile: () => MP4File } | null = null;

async function loadMP4Box(): Promise<{ createFile: () => MP4File }> {
  if (MP4Box) return MP4Box;
  
  // Build the URL relative to the worker's location
  // This handles both localhost and public IP access
  const workerLocation = self.location.href;
  const baseUrl = workerLocation.substring(0, workerLocation.lastIndexOf('/'));
  const mp4boxUrl = new URL('/mp4box.all.js', baseUrl).href;
  
  // Fetch and evaluate the script in worker context
  const response = await fetch(mp4boxUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch mp4box.js: ${response.status} ${response.statusText}`);
  }
  const scriptText = await response.text();
  
  // Use dynamic import workaround - eval the script which sets global MP4Box
  const fn = new Function(scriptText + '\n; return MP4Box;');
  MP4Box = fn() as { createFile: () => MP4File };
  
  if (!MP4Box) {
    throw new Error('Failed to load MP4Box');
  }
  
  return MP4Box;
}

import type {
  WorkerInputMessage,
  WorkerOutputMessage,
  CompressionSettings,
  VideoMetadata,
  EncodingParams,
  CompressionProgress,
} from '../types';
import {
  calculateEncodingParams,
  calculateRetryBitrate,
  calculateScaledDimensions,
  getNextResolutionStep,
  getNextFpsStep,
  isBitrateTooLowForResolution,
} from '../lib/bitrate';
import { ENCODING } from '../lib/constants';

let cancelled = false;

// Post message helper with type safety
function postMessage(message: WorkerOutputMessage) {
  self.postMessage(message);
}

function postProgress(progress: Partial<CompressionProgress>) {
  postMessage({
    type: 'progress',
    progress: {
      stage: 'encoding',
      progress: 0,
      currentAttempt: 1,
      maxAttempts: ENCODING.MAX_ATTEMPTS,
      message: '',
      ...progress,
    },
  });
}

// Main message handler
self.onmessage = async (event: MessageEvent<WorkerInputMessage>) => {
  const message = event.data;

  if (message.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (message.type === 'compress') {
    cancelled = false;
    try {
      await compressVideo(message.file, message.filename, message.settings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      postMessage({
        type: 'error',
        error: errorMessage,
        suggestion: getSuggestionForError(errorMessage),
      });
    }
  }
};

async function compressVideo(
  fileBuffer: ArrayBuffer,
  filename: string,
  settings: CompressionSettings
): Promise<void> {
  const startTime = performance.now();

  // Step 1: Extract metadata
  postProgress({ stage: 'reading', message: 'Reading video file...', progress: 5 });
  
  const metadata = await extractMetadata(fileBuffer, filename);
  postMessage({ type: 'metadata', metadata });

  // Step 2: Calculate initial encoding parameters
  postProgress({ stage: 'analyzing', message: 'Analyzing video...', progress: 10 });
  
  let params = calculateEncodingParams(metadata, settings);
  let currentAttempt = 1;
  let result: Blob | null = null;

  // Step 3: Encoding loop with retries
  while (currentAttempt <= ENCODING.MAX_ATTEMPTS && !cancelled) {
    postProgress({
      stage: currentAttempt === 1 ? 'encoding' : 'retrying',
      message: currentAttempt === 1 
        ? 'Encoding video...' 
        : `Retrying with lower bitrate (attempt ${currentAttempt}/${ENCODING.MAX_ATTEMPTS})...`,
      currentAttempt,
      maxAttempts: ENCODING.MAX_ATTEMPTS,
      currentBitrate: params.videoBitrate,
      progress: 15,
    });

    try {
      result = await encodeVideo(fileBuffer, metadata, params, (progress) => {
        postProgress({
          stage: currentAttempt === 1 ? 'encoding' : 'retrying',
          message: `Encoding: ${Math.round(progress)}%`,
          currentAttempt,
          maxAttempts: ENCODING.MAX_ATTEMPTS,
          currentBitrate: params.videoBitrate,
          progress: 15 + progress * 0.75,
        });
      });

      if (cancelled) {
        postProgress({ stage: 'cancelled', message: 'Compression cancelled' });
        return;
      }

      // Check if result meets target size
      if (result.size <= settings.targetSizeBytes) {
        // Success!
        postProgress({ stage: 'finalizing', message: 'Finalizing MP4...', progress: 95 });
        
        const endTime = performance.now();
        postMessage({
          type: 'complete',
          result: {
            success: true,
            blob: result,
            outputSize: result.size,
            originalSize: metadata.fileSize,
            duration: metadata.duration,
            encodingTime: endTime - startTime,
            attempts: currentAttempt,
            finalBitrate: params.videoBitrate,
          },
        });
        return;
      }

      // Result too large - need to retry
      const newBitrate = calculateRetryBitrate(
        params.videoBitrate,
        result.size,
        settings.targetSizeBytes
      );

      // Check if bitrate is too low for current resolution
      if (isBitrateTooLowForResolution(newBitrate, params.height)) {
        // Try downscaling if allowed
        if (settings.allowDownscale) {
          const nextRes = getNextResolutionStep(params.height);
          if (nextRes) {
            const scaled = calculateScaledDimensions(
              metadata.width,
              metadata.height,
              nextRes.height
            );
            params = {
              ...params,
              width: scaled.width,
              height: scaled.height,
              videoBitrate: calculateEncodingParams(
                { ...metadata, width: scaled.width, height: scaled.height },
                settings
              ).videoBitrate,
            };
            currentAttempt++;
            continue;
          }
        }

        // Try FPS reduction if allowed
        if (settings.allowFpsReduction) {
          const nextFps = getNextFpsStep(params.fps);
          if (nextFps) {
            params = { ...params, fps: nextFps, videoBitrate: newBitrate };
            currentAttempt++;
            continue;
          }
        }

        // Cannot continue - target too small
        throw new Error(
          `Target size is too small for this video. The minimum achievable size at ${params.height}p is approximately ${formatBytes(result.size)}.`
        );
      }

      params = { ...params, videoBitrate: newBitrate };
      currentAttempt++;
    } catch (error) {
      if (cancelled) {
        postProgress({ stage: 'cancelled', message: 'Compression cancelled' });
        return;
      }
      throw error;
    }
  }

  // Max attempts reached
  if (result) {
    const endTime = performance.now();
    
    // Check if we're close enough (within 5%)
    const overagePercent = ((result.size - settings.targetSizeBytes) / settings.targetSizeBytes) * 100;
    
    if (overagePercent <= 5) {
      // Accept slightly over target with warning
      postMessage({
        type: 'complete',
        result: {
          success: true,
          blob: result,
          outputSize: result.size,
          originalSize: metadata.fileSize,
          duration: metadata.duration,
          encodingTime: endTime - startTime,
          attempts: currentAttempt - 1,
          finalBitrate: params.videoBitrate,
        },
      });
    } else {
      // Cannot achieve target
      let suggestion = 'Try increasing your target size';
      if (!settings.allowDownscale) {
        suggestion += ', or enable "Allow downscale" to reduce resolution';
      }
      if (!settings.allowFpsReduction) {
        suggestion += ', or enable "Allow FPS reduction"';
      }
      if (!settings.muteAudio && metadata.hasAudio) {
        suggestion += ', or mute audio to save space';
      }
      
      postMessage({
        type: 'error',
        error: `Could not compress to target size after ${ENCODING.MAX_ATTEMPTS} attempts. Best achieved: ${formatBytes(result.size)}`,
        suggestion,
      });
    }
  }
}

async function extractMetadata(
  buffer: ArrayBuffer,
  filename: string
): Promise<VideoMetadata> {
  const mp4boxLib = await loadMP4Box();
  
  return new Promise((resolve, reject) => {
    const mp4box = mp4boxLib.createFile();

    mp4box.onReady = (info: MP4Info) => {
      const videoTrack = info.videoTracks[0];
      const audioTrack = info.audioTracks[0];

      if (!videoTrack) {
        reject(new Error('No video track found'));
        return;
      }

      const duration = info.duration / info.timescale;
      const fps = videoTrack.nb_samples / duration || 30;

      resolve({
        filename,
        fileSize: buffer.byteLength,
        duration,
        width: videoTrack.video.width,
        height: videoTrack.video.height,
        fps: Math.round(fps * 100) / 100,
        videoCodec: videoTrack.codec,
        audioCodec: audioTrack?.codec ?? null,
        hasAudio: !!audioTrack,
      });
    };

    mp4box.onError = (e) => reject(new Error(String(e)));

    const mp4Buffer = buffer as MP4ArrayBuffer;
    mp4Buffer.fileStart = 0;
    mp4box.appendBuffer(mp4Buffer);
    mp4box.flush();
  });
}

async function encodeVideo(
  buffer: ArrayBuffer,
  metadata: VideoMetadata,
  params: EncodingParams,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const { videoBitrate, width, height, fps, muteAudio } = params;

  // Create muxer
  const muxerTarget = new ArrayBufferTarget();
  const hasAudioTrack = !muteAudio && metadata.hasAudio;
  
  const muxer = hasAudioTrack
    ? new Muxer({
        target: muxerTarget,
        video: {
          codec: 'avc',
          width,
          height,
        },
        audio: {
          codec: 'aac',
          numberOfChannels: 2,
          sampleRate: 48000,
        },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset',
      })
    : new Muxer({
        target: muxerTarget,
        video: {
          codec: 'avc',
          width,
          height,
        },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset',
      });

  // Demux and decode/encode
  const samples = await demuxVideo(buffer);
  const totalFrames = samples.videoSamples.length;
  let processedFrames = 0;

  // Create video encoder
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => {
      console.error('Video encoder error:', e);
    },
  });

  // Try different H.264 profiles in order of preference
  const codecProfiles = [
    'avc1.42001f', // Baseline Level 3.1
    'avc1.4d001f', // Main Level 3.1  
    'avc1.640028', // High Level 4.0
    'avc1.42E01E', // Baseline Level 3.0
    'avc1.4D401E', // Main Level 3.0
    'avc1.64001f', // High Level 3.1
  ];

  let encoderConfig: VideoEncoderConfig | null = null;
  
  for (const codec of codecProfiles) {
    const config: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate: videoBitrate,
      framerate: fps,
    };
    
    const support = await VideoEncoder.isConfigSupported(config);
    if (support.supported) {
      encoderConfig = support.config ?? config;
      console.log(`Using encoder codec: ${codec}`);
      break;
    }
  }

  if (!encoderConfig) {
    throw new Error('No supported H.264 encoder configuration found. Your browser may not support video encoding.');
  }

  videoEncoder.configure(encoderConfig);

  // Create video decoder
  const videoDecoder = new VideoDecoder({
    output: (frame) => {
      if (cancelled) {
        frame.close();
        return;
      }

      let outputFrame: VideoFrame | null = null;
      let needsScaling = false;
      
      try {
        // Scale frame if needed
        needsScaling = frame.displayWidth !== width || frame.displayHeight !== height;
        
        if (needsScaling) {
          // Use synchronous scaling with canvas
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(frame, 0, 0, width, height);
            const frameInit: VideoFrameInit = { timestamp: frame.timestamp };
            if (frame.duration !== null) {
              frameInit.duration = frame.duration;
            }
            outputFrame = new VideoFrame(canvas, frameInit);
          }
        } else {
          outputFrame = frame;
        }

        if (outputFrame) {
          // Encode frame
          const keyFrame = processedFrames % Math.round(fps * ENCODING.KEYFRAME_INTERVAL) === 0;
          videoEncoder.encode(outputFrame, { keyFrame });
        }

        processedFrames++;
        onProgress((processedFrames / totalFrames) * 100);
      } catch (e) {
        console.error('Error processing frame:', e);
      } finally {
        // Always close frames to prevent memory leaks
        if (needsScaling && outputFrame) {
          outputFrame.close();
        }
        frame.close();
      }
    },
    error: (e) => {
      console.error('Video decoder error:', e);
    },
  });

  // Configure decoder based on input codec
  const decoderConfig = getDecoderConfig(metadata, samples.videoSamples[0], samples.videoDescription);
  console.log('Decoder config:', decoderConfig);
  const decoderSupport = await VideoDecoder.isConfigSupported(decoderConfig);
  if (!decoderSupport.supported) {
    throw new Error(`Input video codec not supported: ${metadata.videoCodec}`);
  }
  videoDecoder.configure(decoderSupport.config ?? decoderConfig);

  // Process video samples with frame rate adjustment
  const frameInterval = metadata.fps / fps;
  let frameIndex = 0;

  for (const sample of samples.videoSamples) {
    if (cancelled) break;

    // Skip frames for FPS reduction
    if (fps < metadata.fps) {
      const targetFrame = Math.floor(frameIndex / frameInterval);
      const prevTargetFrame = frameIndex > 0 ? Math.floor((frameIndex - 1) / frameInterval) : -1;
      
      if (targetFrame === prevTargetFrame) {
        frameIndex++;
        continue;
      }
    }

    const chunk = new EncodedVideoChunk({
      type: sample.is_sync ? 'key' : 'delta',
      timestamp: (sample.cts / sample.timescale) * 1_000_000,
      duration: (sample.duration / sample.timescale) * 1_000_000,
      data: sample.data,
    });

    videoDecoder.decode(chunk);
    frameIndex++;
  }

  // Flush decoders and encoders
  await videoDecoder.flush();
  await videoEncoder.flush();

  videoDecoder.close();
  videoEncoder.close();

  // Handle audio - pass through AAC or mute
  if (!muteAudio && metadata.hasAudio && samples.audioSamples.length > 0) {
    // For now, we'll handle audio passthrough for AAC
    // Note: Full audio re-encoding would require AudioEncoder support
    if (metadata.audioCodec?.includes('mp4a')) {
      // AAC passthrough - add audio samples directly
      for (const sample of samples.audioSamples) {
        if (cancelled) break;
        
        const chunk = new EncodedAudioChunk({
          type: 'key',
          timestamp: (sample.cts / sample.timescale) * 1_000_000,
          duration: (sample.duration / sample.timescale) * 1_000_000,
          data: sample.data,
        });
        
        // Note: Audio passthrough may not work perfectly with all inputs
        // This is a known limitation documented in the app
        try {
          muxer.addAudioChunk(chunk);
        } catch {
          // If audio muxing fails, continue without audio
          console.warn('Audio passthrough failed, continuing without audio');
          break;
        }
      }
    }
  }

  // Finalize muxer
  muxer.finalize();

  return new Blob([muxerTarget.buffer], { type: 'video/mp4' });
}

interface DemuxResult {
  videoSamples: MP4Sample[];
  audioSamples: MP4Sample[];
  videoDescription?: Uint8Array;
  audioDescription?: Uint8Array;
}

async function demuxVideo(buffer: ArrayBuffer): Promise<DemuxResult> {
  const mp4boxLib = await loadMP4Box();
  
  return new Promise((resolve, reject) => {
    const mp4box = mp4boxLib.createFile();
    const videoSamples: MP4Sample[] = [];
    const audioSamples: MP4Sample[] = [];
    let videoTrackId: number | null = null;
    let audioTrackId: number | null = null;
    let videoDescription: Uint8Array | undefined;
    let audioDescription: Uint8Array | undefined;

    mp4box.onReady = (info: MP4Info) => {
      const videoTrack = info.videoTracks[0];
      const audioTrack = info.audioTracks[0];

      if (videoTrack) {
        videoTrackId = videoTrack.id;
        mp4box.setExtractionOptions(videoTrack.id, null, { nbSamples: Infinity });
      }

      if (audioTrack) {
        audioTrackId = audioTrack.id;
        mp4box.setExtractionOptions(audioTrack.id, null, { nbSamples: Infinity });
      }

      mp4box.start();
    };

    mp4box.onSamples = (trackId: number, _user: unknown, samples: MP4Sample[]) => {
      if (trackId === videoTrackId) {
        videoSamples.push(...samples);
        // Extract video description from first sample if not already done
        if (!videoDescription && samples[0]?.description) {
          try {
            // mp4box stores the raw box data - we need to extract avcC content
            const desc = samples[0].description as Record<string, unknown>;
            
            if (desc.avcC) {
              const avcC = desc.avcC as Record<string, unknown>;
              
              // mp4box avcC box has these properties we need to manually serialize
              if (avcC.configurationVersion !== undefined) {
                // Get SPS and PPS - mp4box stores them as arrays with nalu property
                const spsRaw = avcC.SPS as Array<{ nalu?: Uint8Array; data?: Uint8Array }> || [];
                const ppsRaw = avcC.PPS as Array<{ nalu?: Uint8Array; data?: Uint8Array }> || [];
                
                // Extract actual data - could be in nalu or data property
                const spsDataList: Uint8Array[] = [];
                const ppsDataList: Uint8Array[] = [];
                
                for (const sps of spsRaw) {
                  const data = sps.nalu || sps.data || (sps as unknown as Uint8Array);
                  if (data instanceof Uint8Array && data.length > 0) {
                    spsDataList.push(data);
                  }
                }
                
                for (const pps of ppsRaw) {
                  const data = pps.nalu || pps.data || (pps as unknown as Uint8Array);
                  if (data instanceof Uint8Array && data.length > 0) {
                    ppsDataList.push(data);
                  }
                }
                
                // Calculate total size
                let totalSize = 6; // Fixed header
                for (const sps of spsDataList) {
                  totalSize += 2 + sps.length;
                }
                totalSize += 1; // numPPS
                for (const pps of ppsDataList) {
                  totalSize += 2 + pps.length;
                }
                
                const buf = new ArrayBuffer(totalSize);
                const view = new DataView(buf);
                const uint8 = new Uint8Array(buf);
                
                let offset = 0;
                view.setUint8(offset++, avcC.configurationVersion as number);
                view.setUint8(offset++, avcC.AVCProfileIndication as number);
                view.setUint8(offset++, avcC.profile_compatibility as number);
                view.setUint8(offset++, avcC.AVCLevelIndication as number);
                view.setUint8(offset++, 0xFF);
                view.setUint8(offset++, 0xE0 | spsDataList.length);
                
                for (const spsData of spsDataList) {
                  view.setUint16(offset, spsData.length);
                  offset += 2;
                  uint8.set(spsData, offset);
                  offset += spsData.length;
                }
                
                view.setUint8(offset++, ppsDataList.length);
                
                for (const ppsData of ppsDataList) {
                  view.setUint16(offset, ppsData.length);
                  offset += 2;
                  uint8.set(ppsData, offset);
                  offset += ppsData.length;
                }
                
                videoDescription = uint8;
              }
            }
          } catch (e) {
            console.warn('Could not extract description from sample:', e);
          }
        }
      } else if (trackId === audioTrackId) {
        audioSamples.push(...samples);
      }
    };

    mp4box.onError = (e) => reject(new Error(String(e)));

    // When all samples are extracted
    setTimeout(() => {
      const result: DemuxResult = { videoSamples, audioSamples };
      if (videoDescription) result.videoDescription = videoDescription;
      if (audioDescription) result.audioDescription = audioDescription;
      resolve(result);
    }, 100);

    const mp4Buffer = buffer as MP4ArrayBuffer;
    mp4Buffer.fileStart = 0;
    mp4box.appendBuffer(mp4Buffer);
    mp4box.flush();
  });
}

function getDecoderConfig(metadata: VideoMetadata, _firstSample?: MP4Sample, avccData?: Uint8Array): VideoDecoderConfig {
  let codec = metadata.videoCodec;
  
  if (codec.startsWith('avc1') || codec.startsWith('avc3')) {
    // Already in correct format
  } else if (codec.includes('h264') || codec.includes('H264')) {
    codec = 'avc1.42001f';
  }

  const config: VideoDecoderConfig = {
    codec,
    codedWidth: metadata.width,
    codedHeight: metadata.height,
  };

  if (avccData) {
    config.description = avccData;
  }

  return config;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getSuggestionForError(error: string): string {
  if (error.includes('codec not supported')) {
    return 'Try converting your video to H.264/MP4 format first using another tool.';
  }
  if (error.includes('too small')) {
    return 'Increase target size, enable downscaling, or reduce video duration.';
  }
  if (error.includes('memory')) {
    return 'Try a smaller video file or close other browser tabs to free up memory.';
  }
  return 'Try refreshing the page and attempting again with different settings.';
}
