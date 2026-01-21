# ClipSqueeze

**Compress videos to a target file size — entirely in your browser.**

ClipSqueeze is a privacy-first, open source video compression tool that runs completely on your device. No uploads, no accounts, no watermarks — just fast, accurate compression to the size you need.

Live demo: `csqueeze.unray.dpdns.org`

## Highlights

- 🔒 **Private by design** — files never leave your device
- 🎯 **Target size control** — hit 8MB, 10MB, 25MB, 50MB, or any custom size
- ⚡ **Fast** — built on WebCodecs for native-speed encoding
- 🆓 **Free forever** — no sign-ups, no limits
- 📱 **Responsive** — works on desktop and mobile

## How it works

1. Drop a video file into the app
2. Choose a target size (preset or custom)
3. Download your compressed MP4

ClipSqueeze calculates the bitrate automatically and retries if needed to keep the final file under your target size.

## Browser support

Best experience on Chromium browsers:

- ✅ Chrome
- ✅ Edge
- ✅ Brave
- ✅ Arc

Limited support:

- ⚠️ Firefox (WebCodecs is experimental)
- ⚠️ Safari (partial WebCodecs support)

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/clipsqueeze.git
cd clipsqueeze

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

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
- **Video processing**: WebCodecs API + mp4box.js

## License

MIT — see [LICENSE](LICENSE).

---

Made for fast, private video compression.
