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

CSqueeze demuxes the source, decodes video and audio, re-encodes H.264 video and AAC audio, and muxes a fresh MP4. Multiple passes refine the bitrate until the result lands within the selected tolerance. If the target is already larger than the source, it skips encoding and returns the original file.

## Browser support

CSqueeze requires WebCodecs and a secure context (HTTPS or localhost). Chromium-based desktop browsers:

- Chrome
- Edge
- Brave
- Opera
- Chromium

Firefox and Safari are not supported because they do not provide the required WebCodecs audio/video encode APIs.

### Audio codec availability

Audio is re-encoded to AAC through WebCodecs. Chrome exposes AAC encoding through platform codecs, so it is available on Windows and macOS. Chrome on Linux currently exposes only Opus encoding; loading a video with audio there shows an `Unsupported audio` error. Enable **Mute audio** in Advanced settings to compress the video track only. Muting produces an MP4 with no audio track.

## Supported formats

| Container | Extensions | Video codecs |
| --- | --- | --- |
| MP4 | `.mp4` | Whatever the browser can decode (typically H.264; HEVC/AV1 depend on platform support) |
| QuickTime | `.mov` | Same as above |
| M4V | `.m4v` | Same as above |

Output is always MP4 / H.264 / AAC. WebM, MKV, and AVI are not accepted; convert them to MP4 first.

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

## License

MIT — see [LICENSE](LICENSE).

---

Made for fast, private video compression.
