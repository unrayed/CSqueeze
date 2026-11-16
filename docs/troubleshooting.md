# Troubleshooting Guide

Common issues and solutions for CSqueeze.

## Browser Issues

### "Use a Chromium-based browser" message

**Cause**: WebCodecs is unavailable.

**Solutions**:

1. Use Chrome, Edge, Brave, Opera, or Chromium on desktop
2. Update to a recent browser version
3. Firefox and Safari are not supported; no flag enables the required encode APIs

### Page crashes or freezes

**Cause**: Usually memory pressure.

**Solutions**:

1. Close other tabs
2. Try a shorter or smaller video
3. Restart the browser
4. Use a device with more RAM

## Compression Issues

### "Missed the target"

**Cause**: The best attempt is still outside the selected tolerance. Small targets can be impossible once audio plus the 100 kbps video floor exceed the budget.

**Solutions**:

1. Click **Retry finer** (half the tolerance, two extra passes)
2. Use Balanced or Best so the resolution ladder can engage
3. Raise the target size
4. Mute audio
5. Lower the resolution or frame-rate cap in Advanced settings

### "Unsupported audio"

**Cause**: The browser cannot decode the source audio, or cannot encode AAC with these settings. Chrome on Linux currently exposes only Opus encoding, so AAC encode is unavailable there.

**Solutions**:

1. Enable **Mute audio** in Advanced settings to compress the video track only
2. Re-export the source with AAC audio
3. Use a platform/browser with AAC encoding (Chrome on Windows or macOS)

### Output quality is poor

**Cause**: Bitrate is too low for the chosen resolution or the content is complex.

**Solutions**:

1. Use Balanced or Best so resolution drops before quality collapses
2. Raise the target size
3. Lower the frame-rate cap
4. Trim the clip first

### Compression takes too long

**Cause**: Large file, high resolution, high fps, or a slower device.

**Solutions**:

1. Watch the progress panel; ETA appears after frames start flowing
2. Use the Fast preset
3. Lower the resolution or frame-rate cap
4. Process shorter clips

### Progress appears stuck

**Cause**: A complex scene or memory pressure. The worker includes demux, audio, encode, and mux phases in overall progress, and it reports elapsed time and ETA.

**Solutions**:

1. Wait briefly; the ETA updates as frames complete
2. If it does not move for several minutes, cancel and retry with a smaller target or lower resolution
3. Refresh and try again

## File Issues

### "Unsupported container"

**Cause**: The file is not MP4, MOV, or M4V.

**Solutions**:

1. Convert WebM, MKV, AVI, or other containers to MP4 first
2. Verify the file plays in your browser
3. Check the file is not corrupted

### "Unsupported video codec"

**Cause**: The browser's `VideoDecoder` cannot decode the source codec.

**Solutions**:

1. Re-export as H.264 MP4
2. Try a browser/platform with support for that codec (HEVC/AV1 depend on the OS and GPU)
3. Try a different file

### File won't select

**Cause**: Extension/MIME type is outside the accepted set.

**Solutions**:

1. Confirm the file is really MP4, MOV, or M4V
2. Rename only if the container is correct; do not rename a WebM to .mp4
3. Convert to MP4 first

## UI Issues

### Dark mode not working

1. Use the theme toggle in the header
2. Select Dark explicitly
3. Clear localStorage and refresh

### Download button doesn't work

1. Check the popup/download blocker
2. Right-click and choose "Save link as..."
3. Try another browser

### Compare previews are not in sync

The two videos share one playhead. If one lags after seeking, press pause and play again. A difference over 0.1 s is corrected automatically during playback.

## Performance Tips

1. Close other tabs to free RAM
2. Use Chrome or Edge desktop for the most tested path
3. Prefer desktop over mobile for long clips
4. Test with short clips first
5. Set realistic targets: 8 MB for a 5-minute video is extremely aggressive

### Typical processing times

| Video | Fast | Balanced/Best |
| --- | --- | --- |
| 30s 720p | 10–20s | 20–60s |
| 60s 1080p | 30–60s | 1–3 min |
| 3 min 1080p | 2–4 min | 5–10 min |

Actual times depend on the device and content.

## Getting Help

1. Check the browser console (F12)
2. Note the browser version and OS
3. Note the container, codecs, duration, resolution, and the error code shown in the UI
4. Report with steps to reproduce
