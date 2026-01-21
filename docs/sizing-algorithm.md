# Sizing Algorithm

This document explains how ClipSqueeze ensures output files are always under the target size.

## The Challenge

Video encoding is not perfectly predictable. The actual output size depends on:
- Video content complexity (motion, detail, colors)
- Scene changes and keyframe placement
- Encoder behavior and optimizations

Given a target bitrate, actual output size can vary by ±10% or more.

## Our Solution: Iterative Encoding with Safety Margins

### Step 1: Initial Bitrate Calculation

```typescript
// Calculate total available bitrate from target size
const targetBits = targetSizeBytes * 8;
const totalBps = targetBits / durationSeconds;

// Reserve space for audio
const videoBps = (totalBps - audioBps) * SAFETY_MARGIN;
```

**Safety Margin**: We use 0.92 (8% buffer) to account for:
- Container overhead (MP4 headers, metadata)
- Encoding variance
- Audio track overhead

### Step 2: Encode and Measure

After encoding, we check the actual output size:

```typescript
if (outputBlob.size <= targetSizeBytes) {
  // Success! Output is under target
  return outputBlob;
} else {
  // Too large, need to retry
  retryWithLowerBitrate();
}
```

### Step 3: Proportional Retry

When output exceeds target, we calculate a new bitrate proportionally:

```typescript
const ratio = targetSizeBytes / actualOutputSize;
const newBitrate = currentBitrate * ratio * RETRY_REDUCTION_FACTOR;
```

**Retry Reduction Factor**: We use 0.95 to ensure we definitely get under target on retry, not just barely at the limit.

### Example Calculation

**Scenario:**
- Target size: 10 MB (10,485,760 bytes)
- Duration: 60 seconds
- Audio: 96 kbps

**Initial calculation:**
```
Total bitrate = (10,485,760 × 8) / 60 = 1,397,435 bps ≈ 1.4 Mbps
Video bitrate = (1,397,435 - 96,000) × 0.92 = 1,197,321 bps ≈ 1.2 Mbps
```

**After first encode:**
- Actual output: 11.2 MB (too large by 12%)

**Retry calculation:**
```
Ratio = 10 / 11.2 = 0.893
New bitrate = 1,197,321 × 0.893 × 0.95 = 1,015,168 bps ≈ 1.0 Mbps
```

**Second attempt:**
- Actual output: 9.6 MB ✓ (under target)

## Resolution and FPS Fallbacks

Sometimes the bitrate becomes too low to produce acceptable quality at the current resolution. When this happens:

### Resolution Downscaling

If enabled by user (`allowDownscale`), we reduce resolution in steps:
1. 1080p → 720p
2. 720p → 480p
3. 480p → 360p

Lower resolution allows higher relative bitrate = better quality per pixel.

### FPS Reduction

If enabled by user (`allowFpsReduction`), we reduce frame rate:
1. 30 fps → 24 fps
2. 24 fps → 20 fps
3. 20 fps → 15 fps

Fewer frames = more bits per frame = higher quality per frame.

### When to Apply

These fallbacks are **last resort** and only used when:
1. User has enabled the option
2. Bitrate would be too low for acceptable quality at current settings
3. Bitrate-only retries have been exhausted

The minimum acceptable bitrate per resolution:
- 1080p: 2 Mbps (50% threshold: 1 Mbps)
- 720p: 1 Mbps (50% threshold: 500 kbps)
- 480p: 500 kbps (50% threshold: 250 kbps)
- 360p: 250 kbps (50% threshold: 125 kbps)

## Maximum Attempts

We limit retries to prevent infinite loops:
- **4 attempts maximum** at each resolution/FPS combination
- Typically succeeds in 1-2 attempts
- 3+ attempts indicates target is very aggressive for the content

## Failure Handling

If we cannot achieve the target after all attempts:

1. **Close but acceptable** (within 5% over): Accept and notify user
2. **Significantly over**: Show error with suggestions:
   - Enable downscaling
   - Enable FPS reduction
   - Increase target size
   - Reduce audio bitrate
   - Mute audio

## Quality Hints

The UI shows quality hints based on estimated bitrate:

| Bitrate (1080p) | Quality Level |
|-----------------|---------------|
| ≥ 8 Mbps | Excellent |
| ≥ 4 Mbps | Good |
| ≥ 2 Mbps | Acceptable |
| ≥ 1 Mbps | Low |
| < 1 Mbps | Very Low |

These thresholds scale with resolution (720p needs ~60% of 1080p bitrate for equivalent quality).

## Constants Reference

```typescript
const ENCODING = {
  SAFETY_MARGIN: 0.92,           // Initial bitrate safety buffer
  MAX_ATTEMPTS: 4,               // Max encoding attempts
  MIN_VIDEO_BITRATE: 100_000,    // Absolute minimum bitrate (100 kbps)
  RETRY_REDUCTION_FACTOR: 0.95,  // Additional reduction on retry
  KEYFRAME_INTERVAL: 2,          // Seconds between keyframes
};
```

## Tips for Users

1. **Longer videos need larger targets** - A 5-minute video at 8MB is much more compressed than a 30-second video at 8MB

2. **Enable downscaling for small targets** - 720p at good quality often looks better than 1080p at very low quality

3. **Consider muting audio** - Audio at 96kbps takes ~720KB per minute. For very small targets, muting saves significant space

4. **Check the quality hint** - If it shows "Very Low", consider increasing your target size
