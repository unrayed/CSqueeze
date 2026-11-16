import { Download, RotateCcw, Check } from 'lucide-react';
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

  const downloadFilename = generateOutputFilename(filename);

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
    <div className="rounded-xl border border-mist-200 bg-white p-5 dark:border-mist-800 dark:bg-mist-900">
      <div className="flex items-start gap-3">
        <Check
          className="mt-0.5 h-5 w-5 shrink-0 text-primary-700 dark:text-primary-300"
          strokeWidth={1.5}
        />
        <div>
          <h3 className="text-sm font-medium">Compressed and ready</h3>
          <p className="mt-0.5 text-sm text-mist-500 dark:text-mist-400">
            Preview the MP4 or download it to your device.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Output size"
          value={formatBytes(result.outputSize)}
          highlight
        />
        <StatCard label="Reduction" value={formatPercentage(reduction)} />
        <StatCard label="Time" value={`${encodingTimeSeconds.toFixed(1)}s`} />
        <StatCard label="Passes" value={String(result.attempts)} />
      </div>

      <div className="mt-4 rounded-lg border border-mist-200 bg-mist-50 p-4 dark:border-mist-800 dark:bg-mist-950/50">
        <div className="flex items-center justify-between text-xs">
          <span className="mono text-mist-500 dark:text-mist-400">
            {formatBytes(result.originalSize)} &rarr; {formatBytes(result.outputSize)}
          </span>
          <span className="mono text-primary-700 dark:text-primary-300">
            {formatPercentage(reduction)} smaller
          </span>
        </div>
        <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-mist-200 dark:bg-mist-800">
          <div
            className="h-full rounded-full bg-primary-700 dark:bg-primary-400"
            style={{ width: `${Math.min(100, (result.outputSize / result.originalSize) * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button onClick={handleDownload} className="btn-primary h-11 flex-1">
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Download MP4
        </button>
        <button onClick={onReset} className="btn-secondary h-11">
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
          Compress another
        </button>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium">Preview</p>
        <div className="overflow-hidden rounded-lg bg-black">
          <video
            src={downloadUrl}
            controls
            preload="auto"
            className="w-full"
            style={{ maxHeight: '300px' }}
          />
        </div>
        <p className="mt-2 text-xs text-mist-500 dark:text-mist-400">
          Browser playback can have minor sync issues. Download the file for the
          most accurate result.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className="rounded-lg border border-mist-200 bg-mist-50 p-3 dark:border-mist-800 dark:bg-mist-950/50">
      <p
        className={`mono text-sm font-medium ${
          highlight
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-mist-900 dark:text-mist-50'
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs leading-4 text-mist-500 dark:text-mist-400">{label}</p>
    </div>
  );
}

function generateOutputFilename(original: string): string {
  const lastDot = original.lastIndexOf('.');
  const baseName = lastDot > 0 ? original.substring(0, lastDot) : original;
  return `${baseName}_squeezed.mp4`;
}
