# Troubleshooting Guide

Common issues and solutions for CSqueeze.

## Browser Issues

### "Browser not supported" message

**Cause**: WebCodecs is unavailable, usually because the browser is older than the supported requirements.

**Solutions**:

1. Use a recent Chrome or Edge on Windows, macOS, or Linux
2. Use Firefox 130+ on desktop; on Linux the distribution FFmpeg must include an H.264 encoder (`libx264`)
3. Use Safari 16.4+ on macOS or iOS; Safari 26+ is required for audio
4. Update the browser and confirm the page runs over HTTPS or localhost
5. Firefox for Android is not supported because it lacks WebCodecs `VideoEncoder`

### Firefox on Linux cannot encode H.264

**Cause**: Firefox uses the system FFmpeg for H.264 WebCodecs encoding. A distribution FFmpeg build without an H.264 encoder such as `libx264` fails the encode probe.

**Solutions**:

1. Install the distribution FFmpeg package that includes `libx264` (common distribution builds do)
2. Confirm the encoder list includes an H.264 encoder: `ffmpeg -encoders`
3. Use Chrome or Edge on Linux instead

### Safari can compress video but audio is unavailable

**Cause**: Safari 16.4–18.x supports WebCodecs H.264 video but has no WebCodecs `AudioDecoder`/`AudioData`, so source audio cannot be decoded.

**Solutions**:

1. Enable **Mute audio** in Advanced settings to compress the video track only
2. Update to Safari 26+ for AAC audio

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

**Cause**: The browser cannot decode the source audio, or both the native AAC encoder and the FDK-AAC WebAssembly fallback failed to encode it.

**Solutions**:

1. Enable **Mute audio** in Advanced settings to compress the video track only
2. Re-export the source with AAC audio
3. On Safari 16.4–18.x, mute audio or update to Safari 26+
4. Try another supported browser; some builds expose a native AAC encoder

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

**Cause**: The browser's `VideoDecoder` does not support the source video codec on this platform.

**Solutions**:

1. Re-export as H.264 MP4, the most reliable input
2. Try a browser/platform whose `VideoDecoder` supports the codec (HEVC, AV1, and VP9 depend on browser/platform support; VP9 and AV1 in MP4 are uncommon)
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
2. Use a recent desktop browser for long clips
3. Prefer desktop over mobile for long clips
4. Test with short clips first
5. Set realistic targets: 8 MB for a 5-minute video is extremely aggressive

Browsers without a native AAC encoder use the FDK-AAC WebAssembly fallback, which adds CPU time proportional to audio duration.

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
