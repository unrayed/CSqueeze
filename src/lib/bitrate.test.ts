import { describe, it, expect } from 'vitest';
import {
  calculateEncodingParams,
  calculateRetryBitrate,
  calculateScaledDimensions,
  isBitrateTooLowForResolution,
  getNextResolutionStep,
  getNextFpsStep,
  estimateOutputSize,
} from './bitrate';
import type { VideoMetadata, CompressionSettings } from '../types';

describe('calculateEncodingParams', () => {
  const baseMetadata: VideoMetadata = {
    filename: 'test.mp4',
    fileSize: 50 * 1024 * 1024, // 50 MB
    duration: 60, // 60 seconds
    width: 1920,
    height: 1080,
    fps: 30,
    videoCodec: 'avc1.42001f',
    audioCodec: 'mp4a.40.2',
    hasAudio: true,
  };

  const baseSettings: CompressionSettings = {
    targetSizeBytes: 10 * 1024 * 1024, // 10 MB
    audioBitrate: 96000,
    allowDownscale: false,
    allowFpsReduction: false,
    muteAudio: false,
  };

  it('calculates video bitrate correctly', () => {
    const params = calculateEncodingParams(baseMetadata, baseSettings);

    // Expected: (10MB * 8 / 60s - 96kbps) * 0.92 safety margin
    const expectedTotalBps = (10 * 1024 * 1024 * 8) / 60;
    const expectedVideoBps = Math.floor((expectedTotalBps - 96000) * 0.92);

    // Allow for small floating-point rounding differences
    expect(params.videoBitrate).toBeCloseTo(expectedVideoBps, -1);
    expect(params.audioBitrate).toBe(96000);
    expect(params.width).toBe(1920);
    expect(params.height).toBe(1080);
    expect(params.fps).toBe(30);
  });

  it('sets audio bitrate to 0 when muted', () => {
    const settings = { ...baseSettings, muteAudio: true };
    const params = calculateEncodingParams(baseMetadata, settings);

    expect(params.audioBitrate).toBe(0);
    expect(params.muteAudio).toBe(true);
  });

  it('respects minimum video bitrate', () => {
    const metadata = { ...baseMetadata, duration: 600 }; // 10 minutes
    const settings = { ...baseSettings, targetSizeBytes: 1 * 1024 * 1024 }; // 1 MB target

    const params = calculateEncodingParams(metadata, settings);

    // Should be at least MIN_VIDEO_BITRATE (100kbps)
    expect(params.videoBitrate).toBeGreaterThanOrEqual(100000);
  });
});

describe('calculateRetryBitrate', () => {
  it('reduces bitrate proportionally when output exceeds target', () => {
    const currentBitrate = 1000000; // 1 Mbps
    const actualSize = 12 * 1024 * 1024; // 12 MB
    const targetSize = 10 * 1024 * 1024; // 10 MB

    const newBitrate = calculateRetryBitrate(currentBitrate, actualSize, targetSize);

    // Expected: 1Mbps * (10/12) * 0.95
    const expectedBitrate = Math.floor(currentBitrate * (10 / 12) * 0.95);
    expect(newBitrate).toBe(expectedBitrate);
  });

  it('never goes below minimum bitrate', () => {
    const currentBitrate = 100000; // 100 kbps
    const actualSize = 100 * 1024 * 1024; // 100 MB
    const targetSize = 1 * 1024 * 1024; // 1 MB - huge reduction

    const newBitrate = calculateRetryBitrate(currentBitrate, actualSize, targetSize);

    expect(newBitrate).toBeGreaterThanOrEqual(100000);
  });
});

describe('calculateScaledDimensions', () => {
  it('maintains aspect ratio when scaling down', () => {
    const result = calculateScaledDimensions(1920, 1080, 720);

    expect(result.height).toBe(720);
    expect(result.width).toBe(1280); // 720 * (1920/1080) = 1280
  });

  it('ensures dimensions are even numbers', () => {
    const result = calculateScaledDimensions(1920, 1080, 719);

    // Should round to even
    expect(result.width % 2).toBe(0);
    expect(result.height % 2).toBe(0);
  });

  it('does not upscale', () => {
    const result = calculateScaledDimensions(1280, 720, 1080);

    expect(result.height).toBeLessThanOrEqual(720);
  });
});

describe('isBitrateTooLowForResolution', () => {
  it('returns false for adequate bitrate at 1080p', () => {
    expect(isBitrateTooLowForResolution(2000000, 1080)).toBe(false);
  });

  it('returns true for very low bitrate at 1080p', () => {
    expect(isBitrateTooLowForResolution(500000, 1080)).toBe(true);
  });

  it('allows lower bitrate at lower resolutions', () => {
    expect(isBitrateTooLowForResolution(500000, 480)).toBe(false);
  });
});

describe('getNextResolutionStep', () => {
  it('returns 720p as next step from 1080p', () => {
    const next = getNextResolutionStep(1080);
    expect(next?.height).toBe(720);
  });

  it('returns 480p as next step from 720p', () => {
    const next = getNextResolutionStep(720);
    expect(next?.height).toBe(480);
  });

  it('returns null at minimum resolution', () => {
    const next = getNextResolutionStep(360);
    expect(next).toBeNull();
  });
});

describe('getNextFpsStep', () => {
  it('returns 24 as next step from 30 fps', () => {
    const next = getNextFpsStep(30);
    expect(next).toBe(24);
  });

  it('returns 20 as next step from 24 fps', () => {
    const next = getNextFpsStep(24);
    expect(next).toBe(20);
  });

  it('returns null at minimum fps', () => {
    const next = getNextFpsStep(15);
    expect(next).toBeNull();
  });
});

describe('estimateOutputSize', () => {
  it('calculates expected output size', () => {
    const videoBitrate = 1000000; // 1 Mbps
    const audioBitrate = 128000; // 128 kbps
    const duration = 60; // 60 seconds

    const size = estimateOutputSize(videoBitrate, audioBitrate, duration);

    // Expected: (1000000 + 128000) * 60 / 8 bytes
    const expectedSize = Math.ceil((videoBitrate + audioBitrate) * duration / 8);
    expect(size).toBe(expectedSize);
  });
});
