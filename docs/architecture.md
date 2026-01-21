# Architecture Overview

This document describes the technical architecture of ClipSqueeze.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │   Main Thread   │    │           Web Worker                │ │
│  │                 │    │                                     │ │
│  │  ┌───────────┐  │    │  ┌─────────┐  ┌─────────────────┐  │ │
│  │  │  React UI │  │◄──►│  │ mp4box  │  │   WebCodecs     │  │ │
│  │  │           │  │    │  │ (demux) │  │ VideoDecoder    │  │ │
│  │  └───────────┘  │    │  └────┬────┘  │ VideoEncoder    │  │ │
│  │                 │    │       │       └────────┬────────┘  │ │
│  │  ┌───────────┐  │    │       ▼                │           │ │
│  │  │  State    │  │    │  ┌─────────┐           │           │ │
│  │  │ Management│  │    │  │Samples  │───────────┘           │ │
│  │  └───────────┘  │    │  └─────────┘                       │ │
│  │                 │    │       │                            │ │
│  └─────────────────┘    │       ▼                            │ │
│                         │  ┌─────────────┐                   │ │
│                         │  │ mp4-muxer   │                   │ │
│                         │  │ (mux to MP4)│                   │ │
│                         │  └──────┬──────┘                   │ │
│                         │         │                          │ │
│                         │         ▼                          │ │
│                         │  ┌─────────────┐                   │ │
│                         │  │  Output     │                   │ │
│                         │  │  Blob       │                   │ │
│                         │  └─────────────┘                   │ │
│                         └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Overview

### Main Thread (UI)

The main thread handles all user interaction and React rendering:

- **React Components**: UI built with React 18 and TypeScript
- **State Management**: React hooks (useState, useCallback) for local state
- **Theme Context**: Dark/light mode with system preference detection

### Web Worker (Encoding)

Heavy video processing runs in a dedicated Web Worker to keep the UI responsive:

- **compression.worker.ts**: Main worker file handling the encoding pipeline
- Receives file data via `postMessage` with transferable ArrayBuffer
- Sends progress updates back to main thread

### Video Processing Pipeline

1. **Demux** (mp4box.js)
   - Parse MP4 container
   - Extract video and audio samples
   - Read metadata (duration, resolution, codec info)

2. **Decode** (WebCodecs VideoDecoder)
   - Decode compressed video samples to raw frames
   - Handle various input codecs (H.264, HEVC, etc.)

3. **Transform** (Optional)
   - Scale frames if downscaling enabled
   - Drop frames if FPS reduction enabled
   - Uses OffscreenCanvas for scaling

4. **Encode** (WebCodecs VideoEncoder)
   - Encode raw frames to H.264
   - Control bitrate for size targeting

5. **Mux** (mp4-muxer)
   - Combine encoded video + audio into MP4 container
   - Generate valid MP4 with proper metadata

## Data Flow

```
User selects file
        │
        ▼
┌───────────────────┐
│ Read file to      │
│ ArrayBuffer       │
└─────────┬─────────┘
          │ Transfer to worker
          ▼
┌───────────────────┐
│ Extract metadata  │
│ (mp4box.js)       │
└─────────┬─────────┘
          │ Post metadata to UI
          ▼
┌───────────────────┐
│ Calculate initial │
│ encoding params   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌─────────────────┐
│ Encode video      │────►│ Check output    │
│ (WebCodecs)       │     │ size            │
└───────────────────┘     └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │ Size OK         │           │ Size too large  │
          │ Return blob     │           │ Retry with      │
          └─────────────────┘           │ lower bitrate   │
                                        └─────────────────┘
```

## Key Design Decisions

### 1. Web Worker for Encoding

Video encoding is CPU-intensive and would block the UI thread if run synchronously. Using a Web Worker:
- Keeps UI responsive during long encodes
- Allows progress updates and cancellation
- Prevents browser "page unresponsive" warnings

### 2. Streaming vs. Buffering

Currently, the entire file is read into memory before processing. This simplifies the implementation but limits file size. Future improvements could:
- Use streaming for demux/mux
- Process chunks incrementally
- Reduce memory footprint

### 3. H.264 Baseline Profile

We use H.264 Baseline profile for maximum compatibility:
- Works on all devices and players
- Supported by all WebCodecs implementations
- Trades some compression efficiency for compatibility

### 4. AAC Audio Passthrough

Instead of re-encoding audio (which requires AudioEncoder support):
- AAC audio is passed through directly
- Non-AAC audio results in muted output
- Simpler and faster for common cases

## File Structure

```
src/
├── components/
│   ├── compressor/          # Main tool components
│   │   ├── CompressorTool.tsx
│   │   ├── FileDropzone.tsx
│   │   ├── VideoInfo.tsx
│   │   ├── TargetSizePicker.tsx
│   │   ├── AdvancedSettings.tsx
│   │   ├── CompressionProgress.tsx
│   │   └── ResultPanel.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── sections/            # Landing page sections
│       ├── Hero.tsx
│       ├── TrustStrip.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       └── FAQ.tsx
├── hooks/
│   ├── useCompression.ts    # Compression state & worker communication
│   └── useVideoMetadata.ts  # Video metadata extraction
├── lib/
│   ├── bitrate.ts           # Bitrate calculations
│   ├── constants.ts         # Configuration constants
│   ├── utils.ts             # Utility functions
│   └── videoMetadata.ts     # Metadata extraction helpers
├── workers/
│   └── compression.worker.ts # Encoding web worker
├── types/
│   ├── index.ts             # Application types
│   └── mp4box.d.ts          # mp4box.js type definitions
└── contexts/
    └── ThemeContext.tsx     # Theme provider
```

## Performance Considerations

### Memory Management

- ArrayBuffers transferred (not copied) to worker
- Frames closed immediately after encoding
- Single file at a time to limit memory usage

### Encoding Speed

- Hardware acceleration used when available (WebCodecs)
- Keyframe interval of 2 seconds balances seek speed and compression
- Progressive encoding with frame-by-frame progress updates

### Bundle Size

- Code splitting for vendor/UI/motion libraries
- Tree-shaking for unused code
- Lazy loading possible for FAQ section
