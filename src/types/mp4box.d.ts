// Type definitions for mp4box.js
declare module 'mp4box' {
  export interface MP4MediaTrack {
    id: number;
    type: 'video' | 'audio' | 'subtitle' | 'metadata';
    codec: string;
    language: string;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    nb_samples: number;
    bitrate: number;
  }

  export interface MP4VideoTrack extends MP4MediaTrack {
    type: 'video';
    video: {
      width: number;
      height: number;
    };
  }

  export interface MP4AudioTrack extends MP4MediaTrack {
    type: 'audio';
    audio: {
      sample_rate: number;
      channel_count: number;
      sample_size: number;
    };
  }

  export interface MP4Info {
    duration: number;
    timescale: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: (MP4VideoTrack | MP4AudioTrack | MP4MediaTrack)[];
    videoTracks: MP4VideoTrack[];
    audioTracks: MP4AudioTrack[];
  }

  export interface MP4Sample {
    number: number;
    track_id: number;
    timescale: number;
    description_index: number;
    description: {
      avcC?: {
        configurationVersion: number;
        AVCProfileIndication: number;
        profile_compatibility: number;
        AVCLevelIndication: number;
      };
      hvcC?: unknown;
    };
    data: Uint8Array;
    size: number;
    alreadyRead: number;
    duration: number;
    cts: number;
    dts: number;
    is_sync: boolean;
    is_leading: number;
    depends_on: number;
    is_depended_on: number;
    has_redundancy: number;
    degradation_priority: number;
    offset: number;
  }

  export interface MP4ArrayBuffer extends ArrayBuffer {
    fileStart?: number;
  }

  export interface MP4File {
    onMoovStart?: () => void;
    onReady?: (info: MP4Info) => void;
    onError?: (e: string) => void;
    onSamples?: (id: number, user: unknown, samples: MP4Sample[]) => void;

    appendBuffer(buffer: MP4ArrayBuffer): number;
    start(): void;
    stop(): void;
    flush(): void;
    setExtractionOptions(
      trackId: number,
      user?: unknown,
      options?: { nbSamples?: number; rapAlignment?: boolean }
    ): void;
    unsetExtractionOptions(trackId: number): void;
    getTrackById(trackId: number): MP4MediaTrack | undefined;
    seek(time: number, useRap?: boolean): { offset: number; time: number };
    getInfo(): MP4Info;
    releaseUsedSamples(trackId: number, sampleNumber: number): void;
  }

  export function createFile(): MP4File;

  export interface DataStream {
    buffer: ArrayBuffer;
    getPosition(): number;
  }

}
