import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebCodecs APIs for testing
globalThis.VideoEncoder = vi.fn() as unknown as typeof VideoEncoder;
globalThis.VideoDecoder = vi.fn() as unknown as typeof VideoDecoder;
globalThis.EncodedVideoChunk = vi.fn() as unknown as typeof EncodedVideoChunk;
globalThis.VideoFrame = vi.fn() as unknown as typeof VideoFrame;

// Mock URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
