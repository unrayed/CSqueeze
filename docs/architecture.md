# Architecture Overview

This document describes the technical architecture of CSqueeze.

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
│  │                 │    │       │       │ AudioDecoder    │  │ │
│  │  ┌───────────┐  │    │       ▼       │ AudioEncoder    │  │ │
│  │  │  State    │  │    │  ┌─────────┐  └────────┬────────┘  │ │
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

The main thread handles user interaction and React rendering:

- **React Components**: UI built with React 18 and TypeScript
- **State Management**: React hooks for local state and worker messages
- **Object URLs**: original and compressed blobs stay alive for the synced compare until reset

### Web Worker (Encoding)

Heavy processing runs in a dedicated module worker:

- **compression.worker.ts**: demux, decode, transform, encode, mux
- Receives the file once via `postMessage` with a transferred `ArrayBuffer`
- Reports progress, completion, cancellation, and structured errors

## Video Processing Pipeline

1. **Container check** — read the `ftyp` box and accept only MP4, MOV, or M4V
2. **Demux once** (mp4box.js) — extract the first video track and first audio track; resolve when all expected samples have been delivered or the demux timeout fires
3. **Plan** — derive audio bitrate, resolution ladder, frame-rate target, and initial video bitrate from the target and preset
4. **Decode video** (WebCodecs `VideoDecoder`) — source timestamps are preserved; decode queue size is bounded
5. **Transform** — draw into one reused `OffscreenCanvas`; scale to the planned resolution, apply rotation, and drop frames on the target-fps time grid
6. **Encode video** (WebCodecs `VideoEncoder`) — H.264 at the planned bitrate, variable bitrate mode, 2-second keyframe interval; encode queue size is bounded
7. **Decode and encode audio once per job** (WebCodecs `AudioDecoder` → `AudioEncoder`) — AAC at the planned bitrate, source sample rate and channel count, mono when the budget is tiny, trimmed to the video duration
8. **Mux** (mp4-muxer) — one fresh muxer per attempt, AAC track configured from the real encoded sample rate and channel count
9. **Measure and refine** — compare the muxed size with the target and correct the video bitrate additively; shift down the resolution ladder when the bitrate would fall below the minimum for the current height; drop 60 fps to 30 fps only after the ladder is exhausted
10. **Report** — return the MP4 blob plus target, actual size, delta, bitrate, resolution, fps, audio, passes, and elapsed time

## Adaptive Planning

### Quality presets

| Preset | Passes | Tolerance | Auto downscale |
| --- | --- | --- | --- |
| Fast | 2 | ±5% | No |
| Balanced | 4 | ±2% | Yes |
| Best | 6 | ±1% | Yes |

`toleranceOverride` and `passesOverride` let the result panel retry with a tighter tolerance and two extra passes.

### Resolution ladder

- `auto` starts at the source height capped to 1080p
- `source` keeps the source height
- numeric caps (1080/720/480/360/240) are never exceeded
- ladder steps are 1080 → 720 → 480 → 360 → 240, skipping anything above the cap
- portrait sources are handled in display orientation: rotation is read from the track matrix, output dimensions are swapped for 90°/270°, and frames are rotated while drawing

### Frame rate

- `auto` preserves source fps and drops to 30 only after the resolution ladder is exhausted and the result is still over target
- `source` always preserves source fps
- numeric caps (60/30/24) are honored

### Audio

- explicit 64/96/128/192 kbps options are clamped to 48–192 kbps
- `auto` derives roughly 10% of the total budget, clamped to 48–160 kbps (with a lower floor allowed for very small targets)
- stereo is downmixed to mono when the derived bitrate is below 64 kbps
- audio is never passed through; if AAC encoding is unavailable, the worker returns an `unsupported-audio` error and the user can mute the audio instead

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
│ Demux once        │
│ (mp4box.js)       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Plan bitrate,     │
│ ladder, fps       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌─────────────────┐
│ Encode audio once │────►│ Reuse AAC chunks│
│ (AAC)             │     │ across passes   │
└───────────────────┘     └────────┬────────┘
          │                        │
          ▼                        ▼
┌───────────────────┐     ┌─────────────────┐
│ Encode video pass │────►│ Mux and measure │
│ (WebCodecs)       │     │ output size     │
└───────────────────┘     └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │ Within tolerance│           │ Outside         │
          │ Return blob     │           │ tolerance       │
          └─────────────────┘           │ Correct bitrate,│
                                        │ ladder, or fps  │
                                        └─────────────────┘
```

## Key Design Decisions

### 1. Web Worker for Encoding

Encoding is CPU-intensive. A worker keeps the UI responsive, supports progress and cancellation, and avoids "page unresponsive" warnings.

### 2. Whole-file Buffering

The entire file is read into memory. This simplifies demuxing and muxing, but limits practical file size. Streaming demux/mux is a future improvement.

### 3. H.264 Output with Profile Probing

Output is always H.264. The worker probes a profile/level fallback list once per job and uses the first supported configuration. Baseline through High are tried; the selected codec string is reported.

### 4. Real AAC Re-encode

Audio is decoded to `AudioData` and re-encoded to AAC, so target math is reliable and non-AAC sources are handled. The muxer is configured from the actual encoded sample rate and channel count. On platforms where Chrome cannot encode AAC (notably Linux), the job fails with a clear `unsupported-audio` error; muting is the supported workaround.

## File Structure

```
src/
├── components/
│   ├── compressor/
│   │   ├── CompressorTool.tsx
│   │   ├── FileDropzone.tsx
│   │   ├── VideoInfo.tsx
│   │   ├── TargetSizePicker.tsx
│   │   ├── QualityPresetPicker.tsx
│   │   ├── AdvancedSettings.tsx
│   │   ├── CompressionProgress.tsx
│   │   ├── PreviewCompare.tsx
│   │   └── ResultPanel.tsx
│   ├── layout/
│   └── sections/
├── hooks/
│   ├── useCompression.ts
│   └── useVideoMetadata.ts
├── lib/
│   ├── bitrate.ts           # Sizing, ladder, correction, classification
│   ├── constants.ts         # Presets, caps, limits
│   ├── media.ts             # Container detection, rotation, validation
│   ├── utils.ts             # Formatting and capability helpers
│   └── videoMetadata.ts     # Event-based metadata extraction
├── workers/
│   └── compression.worker.ts
├── types/
│   └── index.ts
└── contexts/
    └── ThemeContext.tsx
```

## Performance and Memory

- File transferred, not copied, to the worker
- Samples demuxed once and reused across passes
- Decode and encode queue sizes bounded to avoid unbounded frame buffering
- One reused `OffscreenCanvas` per attempt
- `VideoFrame` and `AudioData` objects closed promptly
- One fresh muxer per attempt; previous attempt buffers are released
- Single file at a time
- Keyframe interval of 2 seconds balances seeking and compression
- Progress is monotonic across passes and includes demux, audio, video, and mux phases

## Bundle Size

- Code splitting for vendor, UI, and motion libraries
- The worker is emitted as its own bundle
- No ffmpeg.wasm, no backend
