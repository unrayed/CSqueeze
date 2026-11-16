import { useState, useCallback, useEffect, useRef } from 'react';
import { FileDropzone } from './FileDropzone';
import { VideoInfo } from './VideoInfo';
import { TargetSizePicker } from './TargetSizePicker';
import { QualityPresetPicker } from './QualityPresetPicker';
import { AdvancedSettings } from './AdvancedSettings';
import { CompressionProgress } from './CompressionProgress';
import { ResultPanel } from './ResultPanel';
import { useCompression } from '../../hooks/useCompression';
import { useVideoMetadata } from '../../hooks/useVideoMetadata';
import { SIZE_PRESETS, FILE_LIMITS, QUALITY_PRESETS } from '../../lib/constants';
import type {
  AudioKbps,
  CompressionError,
  CompressionErrorCode,
  CompressionSettings,
  FpsCap,
  QualityPreset,
  ResolutionCap,
} from '../../types';
import {
  Loader2,
  AlertTriangle,
  Info,
  Lightbulb,
  FileWarning,
  RotateCcw,
} from 'lucide-react';

const ERROR_TITLES: Record<CompressionErrorCode, string> = {
  'unsupported-container': 'Unsupported container',
  'unsupported-codec': 'Unsupported video codec',
  'unsupported-audio': 'Unsupported audio',
  'decode-failed': 'Could not decode the video',
  'encode-failed': 'Could not encode the video',
  'mux-failed': 'Could not write the MP4',
  'target-too-small': 'Target is too small',
  memory: 'Ran out of memory',
  'file-too-large': 'File is too large',
  'read-failed': 'Could not read the file',
  cancelled: 'Compression cancelled',
  unknown: 'Compression failed',
};

export function CompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  const {
    metadata,
    thumbnailUrl,
    error: metadataError,
    loadMetadata,
    reset: resetMetadata,
  } = useVideoMetadata();

  useEffect(() => {
    if (!file) {
      setOriginalUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [targetSizeBytes, setTargetSizeBytes] = useState(
    SIZE_PRESETS[0]?.bytes ?? 8 * 1024 * 1024
  );
  const [preset, setPreset] = useState<QualityPreset>('balanced');
  const [resolution, setResolution] = useState<ResolutionCap>('auto');
  const [fps, setFps] = useState<FpsCap>('auto');
  const [audioKbps, setAudioKbps] = useState<AudioKbps>('auto');
  const [muteAudio, setMuteAudio] = useState(false);

  const {
    compress,
    cancel,
    reset: resetCompression,
    progress,
    result,
    error,
    isCompressing,
    status,
  } = useCompression();

  const lastRunSettings = useRef<CompressionSettings | null>(null);

  useEffect(() => {
    if (!metadata) return;
    if (typeof resolution === 'number' && resolution > metadata.height) {
      setResolution('auto');
    }
  }, [metadata, resolution]);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      lastRunSettings.current = null;
      setFile(selectedFile);
      resetCompression();
      void loadMetadata(selectedFile).catch(() => {});
    },
    [loadMetadata, resetCompression]
  );

  const handleReset = useCallback(() => {
    lastRunSettings.current = null;
    setFile(null);
    resetMetadata();
    resetCompression();
  }, [resetMetadata, resetCompression]);

  const targetsAlreadyMet =
    metadata !== null && targetSizeBytes >= metadata.fileSize;

  const handleCompress = useCallback(() => {
    if (!file || !metadata) return;

    const settings: CompressionSettings = {
      targetSizeBytes,
      preset,
      resolution,
      fps,
      audioKbps,
      muteAudio,
    };

    lastRunSettings.current = settings;
    compress(file, settings);
  }, [
    file,
    metadata,
    targetSizeBytes,
    preset,
    resolution,
    fps,
    audioKbps,
    muteAudio,
    compress,
  ]);

  const handleRetryFiner = useCallback(() => {
    const lastSettings = lastRunSettings.current;
    if (!file || !lastSettings) return;

    const presetConfig = QUALITY_PRESETS[lastSettings.preset];
    const retrySettings: CompressionSettings = {
      ...lastSettings,
      toleranceOverride: presetConfig.tolerance / 2,
      passesOverride: presetConfig.maxPasses + 2,
    };

    lastRunSettings.current = retrySettings;
    compress(file, retrySettings);
  }, [file, compress]);

  const activeError: CompressionError | null =
    error ?? result?.error ?? null;
  const showResult =
    status === 'done' &&
    result?.success === true &&
    result.blob !== undefined &&
    result.report !== undefined;
  const showCancelled = !showResult && status === 'cancelled';
  const showError =
    !showResult &&
    !showCancelled &&
    (status === 'error' || activeError !== null);
  const displayError: CompressionError | null =
    activeError ??
    (showError
      ? {
          code: 'unknown',
          message: 'Compression stopped without a message. Try again or choose another file.',
        }
      : null);

  const isFileTooLarge =
    file !== null && file.size > FILE_LIMITS.MAX_RECOMMENDED_SIZE;
  const isDurationTooLong =
    metadata !== null && metadata.duration > FILE_LIMITS.MAX_DURATION;
  const canCompress = file !== null && metadata !== null;

  return (
    <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4 dark:border-mist-800 dark:bg-mist-950 sm:p-5">
      {!file ? (
        <FileDropzone onFileSelect={handleFileSelect} />
      ) : metadata ? (
        <div className="space-y-4">
          <VideoInfo
            metadata={metadata}
            thumbnail={thumbnailUrl}
            onRemove={handleReset}
            disabled={isCompressing}
          />

          {isFileTooLarge && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
                strokeWidth={1.5}
              />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Large file
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  This video is over 500 MB. Processing may be slow on some
                  devices.
                </p>
              </div>
            </div>
          )}
          {isDurationTooLong && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
                strokeWidth={1.5}
              />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Long video
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  Videos over 5 minutes may take a while to encode.
                </p>
              </div>
            </div>
          )}

          {showResult && result && (
            <ResultPanel
              result={result}
              filename={metadata.filename}
              originalUrl={originalUrl}
              hasAudio={metadata.hasAudio}
              onReset={handleReset}
              onRetryFiner={handleRetryFiner}
            />
          )}

          {showCancelled && (
            <div className="flex items-start gap-3 rounded-xl border border-mist-200 bg-white p-4 dark:border-mist-800 dark:bg-mist-900">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-mist-500 dark:text-mist-400"
                strokeWidth={1.5}
              />
              <div>
                <p className="text-sm font-medium">Compression cancelled</p>
                <p className="mt-0.5 text-sm text-mist-500 dark:text-mist-400">
                  Nothing was downloaded. The file and settings are still here.
                </p>
              </div>
            </div>
          )}

          {showError && displayError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
              <div className="flex items-start justify-between gap-3">
                <h4 className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-100">
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
                  {ERROR_TITLES[displayError.code]}
                </h4>
                <span className="mono rounded-md border border-red-200 px-1.5 py-0.5 text-xs leading-4 text-red-700 dark:border-red-900 dark:text-red-300">
                  {displayError.code}
                </span>
              </div>
              <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                {displayError.message}
              </p>
              {displayError.suggestion && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-100/60 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span>{displayError.suggestion}</span>
                </p>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={handleCompress}
                  disabled={!canCompress}
                  className="btn-primary h-9"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                  Try again
                </button>
                <button onClick={handleReset} className="btn-secondary h-9">
                  Choose another file
                </button>
              </div>
            </div>
          )}

          {isCompressing && progress && (
            <CompressionProgress progress={progress} onCancel={cancel} />
          )}

          {isCompressing && !progress && (
            <div className="flex items-center gap-3 rounded-xl border border-mist-200 bg-white p-5 dark:border-mist-800 dark:bg-mist-900">
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-primary-700 dark:text-primary-300"
                strokeWidth={1.5}
              />
              <div>
                <p className="text-sm font-medium">Preparing compression</p>
                <p className="mt-0.5 text-xs text-mist-500 dark:text-mist-400">
                  Reading the file and starting the worker.
                </p>
              </div>
            </div>
          )}

          {!isCompressing && !showResult && (
            <>
              <TargetSizePicker
                targetSizeBytes={targetSizeBytes}
                onChange={setTargetSizeBytes}
                metadata={metadata}
                preset={preset}
                resolution={resolution}
                audioKbps={audioKbps}
                muteAudio={muteAudio}
              />

              <QualityPresetPicker preset={preset} onChange={setPreset} />

              <AdvancedSettings
                resolution={resolution}
                onResolutionChange={setResolution}
                fps={fps}
                onFpsChange={setFps}
                audioKbps={audioKbps}
                onAudioKbpsChange={setAudioKbps}
                muteAudio={muteAudio}
                onMuteAudioChange={setMuteAudio}
                hasAudio={metadata.hasAudio}
                metadata={metadata}
              />

              {!showError && (
                <button
                  onClick={handleCompress}
                  disabled={!canCompress}
                  className="btn-primary h-11 w-full"
                >
                  {targetsAlreadyMet ? 'Keep original file' : 'Compress video'}
                </button>
              )}
            </>
          )}
        </div>
      ) : metadataError ? (
        <div className="py-14 text-center">
          <FileWarning
            className="mx-auto h-6 w-6 text-mist-500 dark:text-mist-400"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-sm font-medium">Could not read this video</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-mist-600 dark:text-mist-300">
            {metadataError}
          </p>
          <button onClick={handleReset} className="btn-secondary mt-4 h-9">
            Choose another video
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2
            className="h-6 w-6 animate-spin text-primary-700 dark:text-primary-300"
            strokeWidth={1.5}
          />
          <span className="mt-4 text-sm text-mist-600 dark:text-mist-300">
            Reading video metadata
          </span>
        </div>
      )}
    </div>
  );
}
