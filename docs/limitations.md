# Known Limitations

This document describes the current limitations of CSqueeze and practical workarounds.

## Browser Support

### WebCodecs requirement

CSqueeze requires WebCodecs and a secure context (HTTPS or localhost).

| Browser | Support | Notes |
| --- | --- | --- |
| Chrome (desktop) | Supported | Recommended |
| Edge (desktop) | Supported | Recommended |
| Brave | Supported | Works well |
| Opera | Supported | Works well |
| Chromium | Supported | Works well |
| Firefox | Not supported | No WebCodecs audio/video encoding |
| Safari | Not supported | No WebCodecs audio/video encoding |

### Mobile browsers

- Chrome for Android may work but is slower and memory-constrained.
- Safari on iOS is not supported.
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

Audio is always re-encoded to AAC through WebCodecs `AudioDecoder` + `AudioEncoder`.

| Situation | Result |
| --- | --- |
| Browser can decode source audio and encode AAC | AAC track at the selected or derived bitrate |
| Source audio codec cannot be decoded | `unsupported-audio` error |
| Browser cannot encode AAC | `unsupported-audio` error |
| Mute audio enabled | MP4 with no audio track |

### Chrome on Linux

Chrome on Linux exposes only Opus encoding through WebCodecs, not AAC. With the fixed MP4/AAC output contract, any file with audio on Linux Chrome stops with an `Unsupported audio` error. Enable **Mute audio** in Advanced settings to compress the video track only.

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

Input video must be decodable by the browser's `VideoDecoder`. In practice:

| Codec | Support |
| --- | --- |
| H.264 (AVC) | Reliable |
| HEVC (H.265) | Depends on platform/GPU support |
| AV1 | Depends on platform support |
| VP9 | Depends on platform support |

Audio must be decodable by `AudioDecoder` (AAC and MP3 are common; Opus in MP4 is uncommon).

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

### Typical times

On a modern laptop:

| Video | Fast | Balanced/Best |
| --- | --- | --- |
| 30s 720p | 10–20s | 20–60s |
| 60s 1080p | 30–60s | 1–3 min |
| 3 min 1080p | 2–4 min | 5–10 min |
| 5 min 1080p | 4–8 min | 10–20 min |

Older devices and mobile may be several times slower.

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
3. Try Chrome or Edge
4. Report with browser version, OS, video details (container, codec, resolution, duration), error code, and steps
