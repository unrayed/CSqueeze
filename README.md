# CSqueeze

**Compress videos to a target file size — entirely in your browser.**

CSqueeze is a privacy-first, open source video compressor that runs completely on your device. No uploads, no accounts, no watermarks. Pick a target size and CSqueeze encodes to it locally with WebCodecs, then tells you exactly what it produced.

Live website: https://csqueeze.unray.dpdns.org

## Highlights

- **Private by design** — files never leave your device
- **Target size control** — 8 MB, 10 MB, 25 MB, 50 MB, 100 MB, or any custom size from 1 to 500 MB
- **Honest reporting** — target vs actual size, delta, bitrate, resolution, frame rate, audio, passes, elapsed time
- **Quality presets** — Fast, Balanced, and Best trade encoding time for a tighter fit
- **Automatic adaptation** — drops resolution (and frame rate when needed) instead of producing an unwatchable bitrate
- **Synced compare** — original and compressed play side by side on one playhead

## How it works

1. Drop an MP4, MOV, or M4V video
2. Choose a target size and quality preset (Advanced settings expose resolution, frame rate, and audio)
3. Compress, compare, and download

CSqueeze demuxes the source, decodes video and, when the browser supports it, audio, re-encodes H.264 video and AAC audio, and muxes a fresh MP4. Multiple passes refine the bitrate until the result lands within the selected tolerance. If the target is already larger than the source, it skips encoding and returns the original file.

## Browser support

CSqueeze requires WebCodecs and a secure context (HTTPS or localhost). Supported requirements:

| Browser | Requirement |
| --- | --- |
| Chrome, Edge, Brave, Opera, and other recent Chromium browsers | Recent release with WebCodecs on Windows, macOS, or Linux |
| Firefox | 130+ on desktop. On Linux, the distribution FFmpeg must include an H.264 encoder (`libx264`) in the common case |
| Safari | 16.4+ on macOS or iOS for H.264 video encoding; 26+ for audio (mute audio on 16.4–18.x) |

Firefox for Android does not support WebCodecs `VideoEncoder`. Safari releases older than 16.4 lack WebCodecs H.264 support. Safari 16.4–18.x has no WebCodecs `AudioDecoder`/`AudioData`, so those versions can compress H.264 video only when audio is muted.

### Audio codec availability

Audio is always encoded to AAC. When the browser exposes a native AAC encoder (Safari 26+, some Chrome/Edge builds), it is used. Otherwise CSqueeze uses a bundled Fraunhofer FDK-AAC WebAssembly encoder: Linux Chromium/Chrome builds without native AAC and all Firefox. Muting is not required on Linux or Firefox to keep audio.

Safari 16.4–18.x cannot decode source audio, so update to Safari 26+ or mute audio.

The WebAssembly fallback encodes audio only; it is not a full-media ffmpeg.wasm fallback. It adds CPU time for long audio. The bundled FDK-AAC code is licensed MIT AND FDK-AAC; the FDK license requires its notice and grants no patent license.

Source audio still needs an audio track the browser can decode. Unusual codecs may fail; enable **Mute audio** in Advanced settings to produce an MP4 with no audio track.

## Supported formats

| Container | Extensions | Video codecs |
| --- | --- | --- |
| MP4 | `.mp4` | H.264 reliable; HEVC, AV1, and VP9 depend on browser/platform decoder support |
| QuickTime | `.mov` | Same as MP4 |
| M4V | `.m4v` | Same as MP4 |

Output is always MP4 / H.264 / AAC. Source video must be decodable by the browser's `VideoDecoder`: H.264 is the reliable input, while HEVC, AV1, and VP9 depend on browser/platform decoder support. VP9 and AV1 in MP4 are uncommon. WebM, MKV, and AVI are not accepted; convert them to MP4 first.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
npm install
npm run dev
```

The app is available at `http://localhost:5173`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checks |

## Tech stack

- **Framework**: React + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Video processing**: WebCodecs API, mp4box.js (demux), mp4-muxer (mux)
- **Audio fallback**: Fraunhofer FDK-AAC WebAssembly encoder when native AAC is unavailable

## License

MIT — see [LICENSE](LICENSE). Bundled FDK-AAC notice: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

Made for fast, private video compression.
