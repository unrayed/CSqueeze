# Known Limitations

This document outlines the current limitations of ClipSqueeze and potential workarounds.

## Browser Support

### WebCodecs Requirement

ClipSqueeze requires the WebCodecs API, which is currently only fully supported in Chromium-based browsers:

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 94+ | ✅ Full | Recommended |
| Edge 94+ | ✅ Full | Recommended |
| Brave | ✅ Full | Works well |
| Opera | ✅ Full | Works well |
| Arc | ✅ Full | Works well |
| Firefox | ⚠️ Partial | Behind flag, may not work |
| Safari | ⚠️ Partial | Limited codec support |

**Workaround**: Use Chrome or Edge for best experience.

### Mobile Browsers

Mobile browser support varies:
- Chrome for Android: Works, but slower
- Safari iOS: Limited/No support
- Samsung Internet: May work

**Note**: Mobile devices have limited memory and processing power. Large videos may fail or be very slow.

---

## File Size Limits

### Recommended Limits

| Aspect | Recommended | Maximum |
|--------|-------------|---------|
| File size | < 200 MB | ~500 MB |
| Duration | < 3 min | 5 min |
| Resolution | 1080p | 4K |

### Memory Constraints

The entire video is loaded into memory for processing. Limits depend on:
- Device RAM
- Browser memory limits
- Other open tabs/apps

**Symptoms of memory issues:**
- Browser becomes unresponsive
- Page crashes
- "Out of memory" errors

**Workarounds:**
1. Close other browser tabs
2. Use a desktop device (more RAM)
3. Process smaller files
4. Trim video before compressing

---

## Audio Handling

### Current Behavior

| Input Audio | Output |
|-------------|--------|
| AAC | Passthrough (preserved) |
| MP3 | Muted |
| Opus | Muted |
| Other | Muted |

### Why This Limitation?

AudioEncoder (the WebCodecs API for audio encoding) has limited browser support and codec availability. Rather than fail for unsupported codecs, we:
1. Pass through AAC audio directly
2. Mute audio for other formats

### Workarounds

1. **Pre-convert to AAC**: Use FFmpeg or another tool to convert audio to AAC before compressing
2. **Enable mute**: If audio isn't important, mute to save file size
3. **Accept current behavior**: Most modern videos already use AAC

### Future Improvement

When AudioEncoder support improves, we plan to:
- Re-encode all audio formats to AAC
- Support configurable audio codecs

---

## Codec Support

### Input Codecs

| Codec | Support |
|-------|---------|
| H.264 (AVC) | ✅ Excellent |
| H.265 (HEVC) | ⚠️ Limited |
| VP8 | ✅ Good |
| VP9 | ✅ Good |
| AV1 | ⚠️ Limited |

### Output Codec

Output is always **H.264 Baseline profile** for maximum compatibility.

### Why H.264 Only?

- Universal playback support
- Hardware encoding widely available
- Best balance of quality, speed, and compatibility

---

## Quality Limitations

### Very Small Target Sizes

When targeting very small sizes (e.g., 8MB for a 2-minute video), quality will be noticeably reduced:

**Visual artifacts:**
- Blocking (square artifacts)
- Banding in gradients
- Loss of fine detail
- Motion blur/smearing

**Workarounds:**
1. Enable "Allow downscale" - Lower resolution at higher bitrate often looks better
2. Increase target size if possible
3. Trim video to reduce duration
4. Accept lower quality for size constraints

### Content Complexity

Some content compresses better than others:

| Content Type | Compression |
|--------------|-------------|
| Talking head, static background | Excellent |
| Screen recording | Good |
| Animation | Good |
| Sports/Action | Poor |
| Nature/High detail | Poor |
| Confetti/Particles | Very poor |

High-motion or high-detail content needs more bitrate for acceptable quality.

---

## Processing Speed

### Factors Affecting Speed

1. **Video duration** - Linear relationship
2. **Resolution** - Higher = slower
3. **Device CPU** - Faster CPU = faster encoding
4. **Hardware acceleration** - When available, significantly faster

### Typical Processing Times

On a modern laptop (Intel i7/M1):

| Video | Expected Time |
|-------|---------------|
| 30s 720p | 10-20 seconds |
| 60s 1080p | 30-60 seconds |
| 3min 1080p | 2-4 minutes |
| 5min 1080p | 4-8 minutes |

Older devices or mobile may be 2-5x slower.

### Why Not Faster?

- Single-threaded encoding (WebCodecs limitation)
- JavaScript overhead
- Memory copying between main thread and worker

---

## Features Not Supported

### Not Currently Implemented

- **Batch processing**: One video at a time
- **Video trimming**: Cannot select start/end times
- **Multiple outputs**: Cannot generate multiple sizes at once
- **Subtitles**: Subtitle tracks are not preserved
- **Multiple audio tracks**: Only primary audio track

### Why These Limitations?

These features would add significant complexity. ClipSqueeze focuses on doing one thing well: compressing a single video to a target size.

---

## Network/Offline

### Offline Support

After initial load, ClipSqueeze works offline. However:
- First visit requires internet to load the app
- No Service Worker for full offline support (yet)

### No Upload Capability

By design, there is no way to upload videos. All processing is local.

---

## Reporting Issues

If you encounter a limitation not listed here:

1. Check browser console for error messages
2. Try with a different video file
3. Try in Chrome (most tested browser)
4. Report issue with:
   - Browser version
   - Video details (codec, resolution, duration)
   - Error message (if any)
   - Steps to reproduce
