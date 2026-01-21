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
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';

export function CompressorTool() {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const { metadata, thumbnail, isLoading: metadataLoading, loadMetadata, reset: resetMetadata } = useVideoMetadata();

  // Settings state - default to 10MB (Discord limit)
  const [targetSizeBytes, setTargetSizeBytes] = useState(SIZE_PRESETS[0]?.bytes ?? 10 * 1024 * 1024);
  const [audioBitrate, setAudioBitrate] = useState(96000);
  const [allowDownscale, setAllowDownscale] = useState(false);
  const [allowFpsReduction, setAllowFpsReduction] = useState(false);
  const [muteAudio, setMuteAudio] = useState(false);

  // Compression state
  const {
    progress,
    result,
    error,
    isCompressing,
    startCompression,
    cancelCompression,
    reset: resetCompression,
  } = useCompression();

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    resetCompression();
    await loadMetadata(selectedFile);
  }, [loadMetadata, resetCompression]);

  // Handle compression start
  const handleCompress = useCallback(() => {
    if (!file) return;

    const settings: CompressionSettings = {
      targetSizeBytes,
      audioBitrate,
      allowDownscale,
      allowFpsReduction,
      muteAudio,
    };

    startCompression(file, settings);
  }, [file, targetSizeBytes, audioBitrate, allowDownscale, allowFpsReduction, muteAudio, startCompression]);

  // Handle reset
  const handleReset = useCallback(() => {
    setFile(null);
    resetMetadata();
    resetCompression();
  }, [resetMetadata, resetCompression]);

  // Check if file is too large
  const isFileTooLarge = file && file.size > FILE_LIMITS.MAX_RECOMMENDED_SIZE;
  const isDurationTooLong = metadata && metadata.duration > FILE_LIMITS.MAX_DURATION;

  // Check if target is smaller than input
  const isTargetLargerThanInput = metadata && targetSizeBytes >= metadata.fileSize;

  return (
    <div className="card overflow-hidden border-2 border-primary-100 dark:border-primary-900">
      {/* File Dropzone or Video Info */}
      {!file ? (
        <FileDropzone onFileSelect={handleFileSelect} />
      ) : metadataLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary-200 dark:border-primary-800" />
            <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-primary-500" />
          </div>
          <span className="mt-4 font-medium text-gray-600 dark:text-gray-400">
            Analyzing your video... 🔍
          </span>
        </div>
      ) : metadata ? (
        <div className="space-y-6">
          <VideoInfo
            metadata={metadata}
            thumbnail={thumbnail}
            onRemove={handleReset}
            disabled={isCompressing}
          />

          {/* Warnings */}
          {isFileTooLarge && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  Heads up! Big file incoming 📦
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  This video is over 500MB. Processing might be slow on some devices.
                </p>
              </div>
            </div>
          )}
          {isDurationTooLong && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  That's a long video! ⏱️
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Videos over 5 minutes may take a while. Maybe grab a snack? 🍿
                </p>
              </div>
            </div>
          )}

          {/* Result Panel (when complete) */}
          {result?.success && result.blob && (
            <ResultPanel
              result={result}
              filename={metadata.filename}
              onReset={handleReset}
            />
          )}

          {/* Error Panel */}
          {error && (
            <div className="rounded-2xl bg-red-50 p-6 dark:bg-red-900/20">
              <h4 className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200">
                <span>😅</span> Oops! Something went wrong
              </h4>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error.message}
              </p>
              {error.suggestion && (
                <p className="mt-3 rounded-xl bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  <strong>💡 Tip:</strong> {error.suggestion}
                </p>
              )}
              <button
                onClick={handleReset}
                className="btn-secondary mt-4"
              >
                Try again with a different file
              </button>
            </div>
          )}

          {/* Progress (when compressing) */}
          {isCompressing && progress && (
            <CompressionProgress
              progress={progress}
              onCancel={cancelCompression}
            />
          )}

          {/* Settings and Compress Button (when not compressing and no result) */}
          {!isCompressing && !result?.success && !error && (
            <>
              {/* Target Size Picker */}
              <TargetSizePicker
                targetSizeBytes={targetSizeBytes}
                onChange={setTargetSizeBytes}
                metadata={metadata}
              />

              {isTargetLargerThanInput && (
                <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
                  <span className="text-xl">💡</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Your target size ({formatSize(targetSizeBytes)}) is larger than the original ({formatSize(metadata.fileSize)}). 
                    We'll still re-encode it, but it won't get any smaller!
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              <AdvancedSettings
                audioBitrate={audioBitrate}
                onAudioBitrateChange={setAudioBitrate}
                allowDownscale={allowDownscale}
                onAllowDownscaleChange={setAllowDownscale}
                allowFpsReduction={allowFpsReduction}
                onAllowFpsReductionChange={setAllowFpsReduction}
                muteAudio={muteAudio}
                onMuteAudioChange={setMuteAudio}
                hasAudio={metadata.hasAudio}
              />

              {/* Compress Button */}
              <button
                onClick={handleCompress}
                className="btn-primary w-full py-4 text-lg"
              >
                <Sparkles className="h-5 w-5" />
                Squeeze It! 🍋
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="py-12 text-center">
          <span className="text-4xl">😕</span>
          <p className="mt-4 text-gray-500">
            Couldn't read that file. Try another video?
          </p>
          <button onClick={handleReset} className="btn-secondary mt-4">
            Select another video
          </button>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
