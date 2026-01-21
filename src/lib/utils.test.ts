import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatBitrate,
  formatPercentage,
  calculateReduction,
  clamp,
} from './utils';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(500)).toBe('500 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(10485760)).toBe('10 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('respects decimal places', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });
});

describe('formatDuration', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats to hh:mm:ss for longer durations', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7325)).toBe('2:02:05');
  });
});

describe('formatBitrate', () => {
  it('formats bitrate correctly', () => {
    expect(formatBitrate(500)).toBe('500 bps');
    expect(formatBitrate(1000)).toBe('1 kbps');
    expect(formatBitrate(96000)).toBe('96 kbps');
    expect(formatBitrate(1000000)).toBe('1.0 Mbps');
    expect(formatBitrate(2500000)).toBe('2.5 Mbps');
  });
});

describe('formatPercentage', () => {
  it('formats percentage with default decimals', () => {
    expect(formatPercentage(50)).toBe('50.0%');
    expect(formatPercentage(33.333)).toBe('33.3%');
    expect(formatPercentage(100)).toBe('100.0%');
  });

  it('respects decimal places', () => {
    expect(formatPercentage(33.333, 0)).toBe('33%');
    expect(formatPercentage(33.333, 2)).toBe('33.33%');
  });
});

describe('calculateReduction', () => {
  it('calculates percentage reduction', () => {
    expect(calculateReduction(100, 50)).toBe(50);
    expect(calculateReduction(100, 75)).toBe(25);
    expect(calculateReduction(100, 100)).toBe(0);
    expect(calculateReduction(100, 0)).toBe(100);
  });

  it('handles zero original size', () => {
    expect(calculateReduction(0, 50)).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
