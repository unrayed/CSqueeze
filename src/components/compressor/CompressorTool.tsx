import { useState, useCallback } from 'react';
import { FileDropzone } from './FileDropzone';
import { VideoInfo } from './VideoInfo';
import { TargetSizePicker } from './TargetSizePicker';
import { AdvancedSettings } from './AdvancedSettings';
import { CompressionProgress } from './CompressionProgress';
import { ResultPanel } from './ResultPanel';
import { useCompression } from '../../hooks/useCompression';
import { useVideoMetadata } from '../../hooks/useVideoMetadata';
import { SIZE_PRESETS, FILE_LIMITS } from '../../lib/constants';
import type { CompressionSettings } from '../../types';
import {
  Loader2,
  AlertTriangle,
  Info,
  Lightbulb,
  FileWarning,
} from 'lucide-react';

export function CompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const { metadata, thumbnail, isLoading: metadataLoading, loadMetadata, reset: resetMetadata } = useVideoMetadata();

  const [targetSizeBytes, setTargetSizeBytes] = useState(SIZE_PRESETS[0]?.bytes ?? 10 * 1024 * 1024);
  const [audioBitrate, setAudioBitrate] = useState(96000);
  const [targetResolution, setTargetResolution] = useState<number | null>(null);
  const [muteAudio, setMuteAudio] = useState(false);

  const {
    progress,
    result,
    error,
    isCompressing,
    startCompression,
    cancelCompression,
    reset: resetCompression,
  } = useCompression();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    resetCompression();
    await loadMetadata(selectedFile);
  }, [loadMetadata, resetCompression]);

  const handleCompress = useCallback(() => {
    if (!file) return;

    const settings: CompressionSettings = {
      targetSizeBytes,
      audioBitrate,
      targetResolution,
      muteAudio,
    };

    startCompression(file, settings);
  }, [file, targetSizeBytes, audioBitrate, targetResolution, muteAudio, startCompression]);

  const handleReset = useCallback(() => {
    setFile(null);
    resetMetadata();
    resetCompression();
  }, [resetMetadata, resetCompression]);

  const isFileTooLarge = file && file.size > FILE_LIMITS.MAX_RECOMMENDED_SIZE;
  const isDurationTooLong = metadata && metadata.duration > FILE_LIMITS.MAX_DURATION;
  const isTargetLargerThanInput = metadata && targetSizeBytes >= metadata.fileSize;

  return (
    <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4 dark:border-mist-800 dark:bg-mist-950 sm:p-5">
      {!file ? (
        <FileDropzone onFileSelect={handleFileSelect} />
      ) : metadataLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2
            className="h-6 w-6 animate-spin text-primary-700 dark:text-primary-300"
            strokeWidth={1.5}
          />
          <span className="mt-4 text-sm text-mist-600 dark:text-mist-300">
            Reading video metadata
          </span>
        </div>
      ) : metadata ? (
        <div className="space-y-4">
          <VideoInfo
            metadata={metadata}
            thumbnail={thumbnail}
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

          {result?.success && result.blob && (
            <ResultPanel
              result={result}
              filename={metadata.filename}
              onReset={handleReset}
            />
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
              <h4 className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-100">
                <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
                Something went wrong
              </h4>
              <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                {error.message}
              </p>
              {error.suggestion && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-100/60 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span>{error.suggestion}</span>
                </p>
              )}
              <button
                onClick={handleReset}
                className="btn-secondary mt-4 h-9"
              >
                Choose another file
              </button>
            </div>
          )}

          {isCompressing && progress && (
            <CompressionProgress
              progress={progress}
              onCancel={cancelCompression}
            />
          )}

          {!isCompressing && !result?.success && !error && (
            <>
              <TargetSizePicker
                targetSizeBytes={targetSizeBytes}
                onChange={setTargetSizeBytes}
                metadata={metadata}
              />

              {isTargetLargerThanInput && (
                <div className="flex items-start gap-3 rounded-xl border border-mist-200 bg-white p-4 dark:border-mist-800 dark:bg-mist-900">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-mist-500 dark:text-mist-400"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm text-mist-600 dark:text-mist-300">
                    The target ({formatSize(targetSizeBytes)}) is larger than the
                    original ({formatSize(metadata.fileSize)}). The file is still
                    re-encoded, but it will not get smaller.
                  </p>
                </div>
              )}

              <AdvancedSettings
                audioBitrate={audioBitrate}
                onAudioBitrateChange={setAudioBitrate}
                targetResolution={targetResolution}
                onTargetResolutionChange={setTargetResolution}
                muteAudio={muteAudio}
                onMuteAudioChange={setMuteAudio}
                hasAudio={metadata.hasAudio}
                metadata={metadata}
              />

              <button
                onClick={handleCompress}
                className="btn-primary h-11 w-full"
              >
                Compress video
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="py-14 text-center">
          <FileWarning
            className="mx-auto h-6 w-6 text-mist-500 dark:text-mist-400"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-sm text-mist-600 dark:text-mist-300">
            That file could not be read. Try another video.
          </p>
          <button onClick={handleReset} className="btn-secondary mt-4 h-9">
            Choose another video
          </button>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
