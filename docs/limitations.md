# Known Limitations

This document describes the current limitations of CSqueeze and practical workarounds.

## Browser Support

### WebCodecs requirement

CSqueeze requires WebCodecs and a secure context (HTTPS or localhost). These are supported requirements, not a tested device matrix.

| Browser | Support | Notes |
| --- | --- | --- |
| Chrome (desktop) | Supported | Recent release with WebCodecs on Windows, macOS, or Linux |
| Edge (desktop) | Supported | Recent release with WebCodecs on Windows, macOS, or Linux |
| Brave / Opera / Chromium | Supported | Follow the Chrome requirements |
| Firefox (desktop) | Supported | 130+; Linux needs a distribution FFmpeg with an H.264 encoder (`libx264`) in the common case |
| Firefox (Android) | Not supported | No WebCodecs `VideoEncoder` |
| Safari 16.4–18.x (macOS/iOS) | Video only | H.264 video encoding; no WebCodecs `AudioDecoder`, so audio must be muted |
| Safari 26+ (macOS/iOS) | Supported | H.264 video and AAC audio |

### Mobile browsers

- Chrome for Android may work but is slower and memory-constrained.
- Safari on iOS 16.4+ can encode H.264 video; iOS Safari 16.4–18.x has no WebCodecs audio APIs, so mute audio. Safari 26+ supports audio.
- Firefox for Android is not supported.
- Large videos may fail on mobile regardless of browser.

---

## File Size Limits

| Aspect | Recommended | Hard limit |
| --- | --- | --- |
| File size | under 500 MB | 2 GB |
| Duration | under 5 minutes | none (warned above 5 minutes) |
| Resolution | 1080p output by default | source height when "Original" is selected |

### Memory constraints

The whole file is read into memory, samples are retained for the job, and the muxed output is buffered before the blob is created. Practical limits depend on device RAM, browser limits, and other open tabs.

Symptoms of memory pressure:

- Browser becomes unresponsive
- Tab crashes
- "Out of memory" errors

Workarounds:

1. Close other tabs
2. Use a desktop device with more RAM
3. Process a shorter clip
4. Trim the video before compressing

---

## Audio Handling

When an audio track is kept, it is always re-encoded to AAC. The source track is decoded with WebCodecs `AudioDecoder`, then encoded with either the browser's native AAC encoder or the bundled FDK-AAC WebAssembly encoder.

AAC encoding uses the browser's native encoder when it is exposed (Safari 26+, some Chrome/Edge builds). Otherwise CSqueeze encodes with the bundled Fraunhofer FDK-AAC WebAssembly encoder: Linux Chromium/Chrome builds without native AAC and all Firefox.

| Situation | Result |
| --- | --- |
| Browser can decode source audio | AAC track at the selected or derived bitrate, encoded natively or with FDK-AAC WebAssembly |
| Source audio codec cannot be decoded | `unsupported-audio` error |
| Native and WebAssembly AAC encoding both fail | `unsupported-audio` error |
| Safari 16.4–18.x | No WebCodecs audio decode; mute audio or update to Safari 26+ |
| Mute audio enabled | MP4 with no audio track |

### AAC WebAssembly fallback

The fallback is audio-only; it is not a full-media ffmpeg.wasm replacement. It adds CPU time proportional to audio duration, so long files with audio are slower on browsers without native AAC. The bundled code is licensed MIT AND FDK-AAC; the FDK license requires its notice and grants no patent license.

Muting remains useful for unusual source audio or tight targets. It is not required on Linux or Firefox to keep audio.

### Multi-track audio

Only the first audio track is read. Additional audio tracks are dropped.

---

## Container and Codec Support

### Accepted containers

| Container | Accepted |
| --- | --- |
| MP4 | Yes |
| MOV | Yes |
| M4V | Yes |
| WebM | No |
| MKV | No |
| AVI | No |

Unsupported containers are rejected before compression with an `Unsupported container` error. Convert them to MP4 first.

### Input codecs

Input video must be decodable by the browser's `VideoDecoder`. The worker extracts the `avcC` or `hvcC` codec description where present and always outputs H.264. In practice:

| Codec | Support |
| --- | --- |
| H.264 (AVC) | Reliable |
| HEVC (H.265) | Depends on browser/platform decoder support |
| AV1 | Depends on browser/platform decoder support; uncommon in MP4 |
| VP9 | Depends on browser/platform decoder support; uncommon in MP4 |

Audio must be decodable by `AudioDecoder` (AAC and MP3 are common). Opus-in-MP4 tracks are supported when the browser's `AudioDecoder` can decode `opus`; Opus in MP4 is uncommon. Safari 16.4–18.x has no `AudioDecoder`, so audio tracks cannot be decoded there.

### Output

Output is always MP4 / H.264 / AAC. The H.264 profile is chosen once per job from a support probe (Baseline through High); the report shows the selected codec string. There is no HEVC, AV1, or WebM output.

---

## Quality Limitations

### Very small targets

Small targets reduce quality noticeably:

- Blocking
- Banding in gradients
- Loss of fine detail
- Motion smear

Mitigations:

1. Use the Balanced or Best preset so the resolution ladder can engage
2. Raise the target size
3. Trim the video
4. Lower the frame-rate cap in Advanced settings

### Content complexity

| Content | Compressibility |
| --- | --- |
| Talking head, static background | Excellent |
| Screen recording | Good |
| Animation | Good |
| Sports/action | Poor |
| Nature/high detail | Poor |
| Particles/confetti | Very poor |

### Target misses

The result panel always reports the truth. If no attempt lands inside the selected tolerance:

- The best attempt is returned with an amber "Missed the target" state
- The exact overage is shown
- **Retry finer** re-runs with half the tolerance and two extra passes

A target smaller than the minimum video bitrate plus audio can be impossible; the report will show the miss.

---

## Processing Speed

### Factors

1. Duration
2. Resolution
3. Frame rate
4. Device CPU/GPU
5. Preset (Fast 2 passes, Balanced 4, Best 6)
6. AAC encoder path (native or FDK-AAC WebAssembly)

### Typical times

On a modern laptop:

| Video | Fast | Balanced/Best |
| --- | --- | --- |
| 30s 720p | 10–20s | 20–60s |
| 60s 1080p | 30–60s | 1–3 min |
| 3 min 1080p | 2–4 min | 5–10 min |
| 5 min 1080p | 4–8 min | 10–20 min |

Older devices and mobile may be several times slower. The FDK-AAC WebAssembly fallback adds CPU time proportional to audio duration; browsers with native AAC are faster on long audio.

---

## Features Not Supported

- Batch processing: one video at a time
- Trimming or start/end selection
- Crop or custom width/height
- Multiple outputs at once
- Subtitle/chapter/metadata preservation
- Multiple audio tracks
- Output codec or container choice
- HEVC, AV1, or WebM output
- Frame-accurate compare slider (playback is synced, not frame-stepped)

CSqueeze focuses on doing one thing well: compressing a single video to a target size with an honest report.

---

## Network and Offline

After the app loads, compression is fully local and no network requests are needed. The first visit requires internet to load the app. There is no service worker, so a full offline reload is not supported.

No upload capability exists by design.

---

## Reporting Issues

1. Check the browser console (F12)
2. Reproduce with a different video
3. Try a different supported browser
4. Report with browser version, OS, video details (container, codec, resolution, duration), error code, and steps
