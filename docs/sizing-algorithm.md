# Sizing Algorithm

This document explains how CSqueeze targets a file size.

## The Challenge

Encoded size is not perfectly predictable. It depends on content complexity, keyframe placement, encoder behavior, and container overhead. A bitrate that produces 10.0 MB on one clip can produce 8.5 MB or 12.0 MB on another.

## Iterative Encoding with Additive Correction

### Step 1: Initial bitrate

```ts
const totalBps = (targetBytes * 8) / durationSeconds;
const overheadBps = max(totalBps * 0.02, (4096 * 8) / durationSeconds);
const videoBps = max(totalBps - audioBps - overheadBps, 100_000);
```

The explicit container-overhead estimate replaces the old flat 8% margin: 2% of the total plus a fixed 4 KiB allowance, whichever is larger.

Audio is planned first:

- explicit 64/96/128/192 kbps is clamped to 48–192 kbps
- `auto` uses about 10% of the total budget, clamped to 48–160 kbps
- very small targets may use a floor below 48 kbps
- stereo is downmixed to mono when the derived bitrate is under 64 kbps

### Step 2: Choose the starting resolution and fps

The resolution ladder is built from the source display height and the selected cap:

- `auto`: source height capped at 1080p, then 720 → 480 → 360 → 240
- `source`: source height only
- numeric caps: 1080/720/480/360/240, never exceeded

The initial level is the largest level whose minimum bitrate fits the planned video bitrate. When the preset disables auto downscale (Fast), the cap/source level is used directly.

Frame rate starts at the source fps (or a numeric cap). It only drops to 30 when the resolution ladder is exhausted and the result is still over target, and only for the `auto` policy.

### Step 3: Encode, mux, measure

Each attempt decodes the retained samples, encodes video at the planned bitrate, reuses the audio chunks encoded once for the job, and muxes a fresh MP4. The muxed byte length is the measurement.

Classification:

```ts
hitTarget      = outputBytes <= targetBytes
overTarget     = outputBytes >  targetBytes
withinTolerance = abs(outputBytes - targetBytes) / targetBytes <= tolerance
targetDeltaRatio = (outputBytes - targetBytes) / targetBytes
```

The loop stops when the result is within tolerance or the pass budget is exhausted.

### Step 4: Correct according to the measured gap

Correction is additive, not a blind ratio:

```ts
deltaBps = ((targetBytes - actualBytes) * 8) / durationSeconds;
gain = deltaBytes > 0 ? 0.8 : 0.9;
nextBitrate = max(100_000, currentBitrate + deltaBps * gain);
```

This both shrinks overshoots and raises bitrate when the encoder undershot, so a far-under-target result is retried upward for quality instead of being accepted as "small enough".

If the corrected bitrate would fall below the minimum for the current height and auto downscale is enabled, the next attempt moves down the ladder. If the lowest level is already in use and the result is still over target, the frame rate drops to 30 when allowed.

If neither the bitrate, level, nor fps would change, the loop nudges the bitrate by 3% down (over target) or 5% up (under target) to avoid an identical retry.

### Pass budgets and tolerances

| Preset | Passes | Tolerance | Auto downscale |
| --- | --- | --- | --- |
| Fast | 2 | ±5% | No |
| Balanced | 4 | ±2% | Yes |
| Best | 6 | ±1% | Yes |

**Retry finer** uses `toleranceOverride = presetTolerance / 2` and `passesOverride = presetPasses + 2` (clamped to 12 passes and a 0.1% minimum tolerance).

### Minimum video bitrate per height

| Height | Minimum |
| --- | --- |
| 1080 | 1.6 Mbps |
| 720 | 850 kbps |
| 480 | 420 kbps |
| 360 | 200 kbps |
| 240 | 110 kbps |
| below 240 | 100 kbps absolute floor |

These values drive the ladder, not a hard output ceiling: the absolute video floor is 100 kbps.

### Example

Target 10 MB, duration 60 s, AAC 96 kbps:

```
totalBps    = 10,485,760 * 8 / 60 = 1,398,101
overheadBps = max(27,962, 546)     = 27,962
videoBps    = 1,398,101 - 96,000 - 27,962 = 1,274,139
```

If the first mux lands at 11.0 MB (1,048,576 bytes over target), the correction adds roughly:

```
deltaBps = 1,048,576 * 8 / 60 = 139,810
next     = 1,274,139 - 139,810 * 0.9 = 1,148,310
```

The next attempt encodes at about 1.15 Mbps. If that falls below the ladder threshold for the current height, CSqueeze drops a resolution step instead of crushing quality at the same size.

## Target Already Met

If `targetBytes >= sourceFileBytes`, the worker skips encoding entirely, returns the original bytes, and marks the report `skipped: true`. The UI labels the download as the original file and keeps its real container type.

## Failure Handling

The worker always returns the best completed attempt when one exists, even if it missed the target. The report carries `hitTarget`, `overTarget`, `withinTolerance`, and `targetDeltaRatio`; the UI shows an amber over-target state with **Retry finer**. There is no silent "close enough" success at 5%.

Encoding/decoding/muxing failures are returned as structured errors with a code and suggestion. Common causes:

- container outside MP4/MOV/M4V
- source video codec the browser's `VideoDecoder` cannot decode on this platform (H.264 is the reliable input; HEVC, AV1, and VP9 depend on browser/platform support)
- source audio the browser cannot decode, or both native AAC and FDK-AAC WebAssembly encoding fail (Safari 16.4–18.x has no WebCodecs audio decode)
- target too small for the audio budget plus the 100 kbps video floor

## Tips

1. Longer videos need larger targets.
2. Balanced/Best engage the resolution ladder, which usually beats squeezing 1080p into a tiny bitrate.
3. Mute audio when the target is tight or the source audio cannot be decoded.
4. Use Fast when you want to keep source resolution and accept a looser fit.
5. Check the report: resolution, fps, audio, and pass count explain what the encoder did.
6. Safari 16.4–18.x requires muted audio; Safari 26+ supports AAC audio.
