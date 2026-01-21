import { Download, RotateCcw } from 'lucide-react';
import { formatBytes, formatPercentage, calculateReduction } from '../../lib/utils';
import type { CompressionResult } from '../../types';

interface ResultPanelProps {
  result: CompressionResult;
  filename: string;
  onReset: () => void;
}

export function ResultPanel({ result, filename, onReset }: ResultPanelProps) {
  if (!result.blob || !result.outputSize) return null;

  const reduction = calculateReduction(result.originalSize, result.outputSize);
  const encodingTimeSeconds = result.encodingTime / 1000;

  // Generate download filename
  const downloadFilename = generateOutputFilename(filename);

  // Create download URL
  const downloadUrl = URL.createObjectURL(result.blob);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-3xl border-2 border-primary-200 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-900/20">
      {/* Success header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-3xl dark:bg-primary-900/50">
          🎉
        </div>
        <div>
          <h3 className="text-xl font-bold text-primary-800 dark:text-primary-200">
            Squeezed successfully!
          </h3>
          <p className="text-primary-700 dark:text-primary-300">
            Your video is ready to download
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Output size"
          value={formatBytes(result.outputSize)}
          emoji="📦"
          highlight
        />
        <StatCard
          label="Reduction"
          value={formatPercentage(reduction)}
          emoji="📉"
        />
        <StatCard
          label="Time"
          value={`${encodingTimeSeconds.toFixed(1)}s`}
          emoji="⏱️"
        />
        <StatCard
          label="Attempts"
          value={String(result.attempts)}
          emoji="🔄"
        />
      </div>

      {/* Visual size comparison */}
      <div className="mt-6 rounded-2xl bg-white p-4 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {formatBytes(result.originalSize)} → {formatBytes(result.outputSize)}
          </span>
          <span className="font-bold text-primary-600 dark:text-primary-400">
            {formatPercentage(reduction)} smaller! ✨
          </span>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="absolute inset-0 flex">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${Math.min(100, (result.outputSize / result.originalSize) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleDownload}
          className="btn-primary flex-1 py-4"
        >
          <Download className="h-5 w-5" />
          Download MP4
        </button>
        <button
          onClick={onReset}
          className="btn-secondary py-4"
        >
          <RotateCcw className="h-5 w-5" />
          Squeeze another
        </button>
      </div>

      {/* Preview player */}
      <div className="mt-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>👀</span> Preview
        </p>
        <div className="overflow-hidden rounded-2xl bg-black">
          <video
            src={downloadUrl}
            controls
            preload="auto"
            className="w-full"
            style={{ maxHeight: '300px' }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Tip: For best playback, download the file. Browser preview may have minor sync issues.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  emoji: string;
  highlight?: boolean;
}

function StatCard({ label, value, emoji, highlight }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center dark:bg-gray-800">
      <div className="text-2xl">{emoji}</div>
      <p
        className={`mt-1 text-xl font-bold ${
          highlight
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function generateOutputFilename(original: string): string {
  const lastDot = original.lastIndexOf('.');
  const baseName = lastDot > 0 ? original.substring(0, lastDot) : original;
  return `${baseName}_squeezed.mp4`;
}
