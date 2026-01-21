# Troubleshooting Guide

Common issues and solutions for ClipSqueeze.

## Browser Issues

### "Browser not supported" message

**Cause**: WebCodecs API is not available.

**Solutions**:
1. Use Chrome, Edge, or another Chromium-based browser
2. Update your browser to the latest version
3. If using Firefox, WebCodecs is behind a flag and may not work fully

### Page crashes or freezes

**Cause**: Usually memory-related.

**Solutions**:
1. Close other browser tabs to free memory
2. Try a smaller video file
3. Restart your browser
4. Use a device with more RAM

## Compression Issues

### "Could not compress to target size"

**Cause**: Target size is too small for the video.

**Solutions**:
1. Enable "Allow downscale" in advanced settings
2. Enable "Allow FPS reduction" in advanced settings
3. Increase your target size
4. Mute audio to save space
5. Trim your video (use another tool first)

### Output quality is very poor

**Cause**: Bitrate is too low for the resolution.

**Solutions**:
1. Enable "Allow downscale" - lower resolution at higher bitrate looks better
2. Increase target size
3. Reduce video duration before compressing

### Compression takes too long

**Cause**: Large file, high resolution, or slow device.

**Solutions**:
1. Be patient - progress is shown in the UI
2. Use a more powerful device
3. Process shorter/smaller videos
4. Close other applications

### Output has no audio

**Cause**: Input audio is not AAC format.

**Solutions**:
1. Convert source video to use AAC audio first
2. Accept muted output if audio isn't critical
3. Most MP4 files from phones use AAC and should work

## File Issues

### "No video track found"

**Cause**: File is not a valid video or uses unsupported container.

**Solutions**:
1. Verify the file plays in your browser
2. Try converting to MP4 format first
3. Check if file is corrupted

### "Input video codec not supported"

**Cause**: Video uses a codec WebCodecs can't decode.

**Solutions**:
1. Convert to H.264 using FFmpeg or HandBrake
2. Try a different video file

### File won't upload/select

**Cause**: File type not recognized.

**Solutions**:
1. Rename file extension to .mp4 if it's actually an MP4
2. Convert to a supported format
3. Check file isn't corrupted

## UI Issues

### Dark mode not working

**Solutions**:
1. Click the theme toggle in the header
2. Select "Dark" explicitly
3. Clear localStorage and refresh

### Progress stuck at a percentage

**Cause**: Encoding a complex section or memory pressure.

**Solutions**:
1. Wait a bit longer - complex scenes take more time
2. If stuck for minutes, cancel and try smaller target size
3. Refresh page and try again

### Download button doesn't work

**Solutions**:
1. Check if popup blocker is preventing download
2. Right-click and "Save link as..."
3. Try a different browser

## Performance Tips

### For best results:

1. **Close other tabs** - More RAM available for processing
2. **Use Chrome** - Best WebCodecs support
3. **Desktop over mobile** - More processing power
4. **Smaller files first** - Test with short clips
5. **Reasonable targets** - Don't expect miracles from 8MB for a 5-min video

### Estimated processing times:

- 30 seconds @ 720p: ~15 seconds
- 1 minute @ 1080p: ~45 seconds
- 3 minutes @ 1080p: ~3 minutes

Actual times depend on your device.

## Getting Help

If you're still having issues:

1. Check browser console (F12) for error messages
2. Note your browser version and OS
3. Describe the video (format, duration, resolution)
4. Report with steps to reproduce
