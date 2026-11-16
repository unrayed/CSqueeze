import { useEffect, useState } from 'react';
import {
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import {
  cn,
  formatBitrate,
  formatBytes,
  formatDuration,
  formatPercentage,
  calculateReduction,
} from '../../lib/utils';
import { PreviewCompare } from './PreviewCompare';
import type { CompressionResult } from '../../types';

interface ResultPanelProps {
  result: CompressionResult;
  filename: string;
  originalUrl: string | null;
  hasAudio: boolean;
  onReset: () => void;
  onRetryFiner: () => void;
}

export function ResultPanel({
  result,
  filename,
  originalUrl,
  hasAudio,
  onReset,
  onRetryFiner,
}: ResultPanelProps) {
  const blob = result.blob;
  const report = result.report;

  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setCompressedUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setCompressedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!blob || !report || !compressedUrl) return null;

  const deltaPct =
    report.targetBytes > 0
      ? ((report.outputBytes - report.targetBytes) / report.targetBytes) * 100
      : 0;
  const deltaText = `${deltaPct > 0 ? '+' : deltaPct < 0 ? '−' : ''}${Math.abs(
    deltaPct
  ).toFixed(1)}%`;
  const reduction = calculateReduction(report.originalBytes, report.outputBytes);
  const sizeChangeLabel =
    reduction >= 0
      ? `${formatPercentage(reduction)} smaller`
      : `${formatPercentage(Math.abs(reduction))} larger`;
  const downloadFilename = report.skipped
    ? filename
    : generateOutputFilename(filename);

  const videoBitsPerSecond =
    report.durationSeconds > 0
      ? Math.max(
          0,
          (report.outputBytes * 8) / report.durationSeconds -
            (report.audioBitrate ?? 0)
        )
      : 0;
  const audioLabel = report.skipped
    ? report.audioCodec !== null
      ? report.audioChannels > 0
        ? `Original · ${report.audioChannels} ch`
        : 'Original'
      : 'No audio'
    : report.audioCodec !== null && report.audioBitrate !== null
      ? `${Math.round(report.audioBitrate / 1000)} kbps · ${report.audioChannels} ch`
      : hasAudio
        ? 'Muted'
        : 'No audio';
  const overByBytes = Math.max(0, report.outputBytes - report.targetBytes);
  const outputShare =
    report.originalBytes > 0
      ? Math.min(100, (report.outputBytes / report.originalBytes) * 100)
      : 0;

  const heading = report.overTarget
    ? 'Missed the target'
    : report.skipped
      ? 'Already under target'
      : 'Compressed and ready';

  return (
    <div className="rounded-xl border border-mist-200 bg-white p-5 dark:border-mist-800 dark:bg-mist-900">
      <div className="flex items-start gap-3">
        {report.overTarget ? (
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
            strokeWidth={1.5}
          />
        ) : report.skipped ? (
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-mist-500 dark:text-mist-400"
            strokeWidth={1.5}
          />
        ) : (
          <Check
            className="mt-0.5 h-5 w-5 shrink-0 text-primary-700 dark:text-primary-300"
            strokeWidth={1.5}
          />
        )}
        <div>
          <h3
            className={cn(
              'text-sm font-medium',
              report.overTarget && 'text-amber-900 dark:text-amber-100'
            )}
          >
            {heading}
          </h3>
          <p
            className={cn(
              'mt-0.5 text-sm',
              report.overTarget
                ? 'text-amber-800 dark:text-amber-200'
                : 'text-mist-500 dark:text-mist-400'
            )}
          >
            {report.overTarget
              ? 'The result is over the target. Retry finer to tighten the tolerance and add two passes.'
              : report.skipped
                ? 'The source is already at or under this target. It was kept without re-encoding.'
                : 'Compare it with the original, then download.'}
          </p>
        </div>
      </div>

      {report.overTarget && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
              strokeWidth={1.5}
            />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {formatBytes(overByBytes)} over target (
                {formatPercentage(Math.abs(deltaPct))})
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                The encoder spent {report.passes} passes and still landed over.
              </p>
            </div>
          </div>
          <button
            onClick={onRetryFiner}
            className="btn-secondary h-9 shrink-0 border-amber-300 bg-amber-100/70 text-amber-900 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/70"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Retry finer
          </button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Target" value={formatBytes(report.targetBytes)} tone="default" />
        <StatCard
          label="Actual"
          value={formatBytes(report.outputBytes)}
          tone={report.overTarget ? 'warning' : 'highlight'}
        />
        <StatCard
          label="vs target"
          value={deltaText}
          tone={report.overTarget ? 'warning' : 'highlight'}
        />
        <StatCard label="Reduction" value={formatPercentage(reduction)} tone="default" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-mist-200 bg-mist-50 p-4 dark:border-mist-800 dark:bg-mist-950/50 sm:grid-cols-2">
        <DetailRow
          label="Video bitrate"
          value={
            report.skipped
              ? 'Not re-encoded'
              : `${formatBitrate(videoBitsPerSecond)} (est.)`
          }
        />
        <DetailRow
          label="Resolution"
          value={`${report.width}×${report.height}${report.resolutionReduced ? ' · downscaled' : ''}`}
        />
        <DetailRow
          label="Frame rate"
          value={`${Math.round(report.fps)} fps${report.fpsReduced ? ' · capped' : ''}`}
        />
        <DetailRow label="Audio" value={audioLabel} />
        <DetailRow label="Passes" value={String(report.passes)} />
        <DetailRow label="Elapsed" value={formatElapsed(report.elapsedMs)} />
      </div>
      {!report.skipped && (
        <p className="mono mt-2 text-xs leading-5 text-mist-500 dark:text-mist-400">
          Video bitrate is derived from output size minus the audio bitrate.
        </p>
      )}

      <div className="mt-4 rounded-lg border border-mist-200 bg-mist-50 p-4 dark:border-mist-800 dark:bg-mist-950/50">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
          <span className="mono text-mist-500 dark:text-mist-400">
            {formatBytes(report.originalBytes)} &rarr; {formatBytes(report.outputBytes)}
          </span>
          <span
            className={cn(
              'mono',
              report.overTarget || reduction < 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-primary-700 dark:text-primary-300'
            )}
          >
            {sizeChangeLabel}
          </span>
        </div>
        <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-mist-200 dark:bg-mist-800">
          <div
            className={cn(
              'h-full rounded-full',
              report.overTarget || reduction < 0
                ? 'bg-amber-500'
                : 'bg-primary-700 dark:bg-primary-400'
            )}
            style={{ width: `${outputShare}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <a
          href={compressedUrl}
          download={downloadFilename}
          className="btn-primary h-11 flex-1"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          {report.skipped ? 'Download original' : 'Download MP4'}
        </a>
        <button onClick={onReset} className="btn-secondary h-11">
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
          Compress another
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">
          {report.skipped ? 'Preview' : 'Compare'}
        </p>
        {report.skipped ? (
          <div className="overflow-hidden rounded-lg bg-black">
            <video
              src={compressedUrl}
              controls
              preload="metadata"
              playsInline
              className="aspect-video w-full object-contain"
              aria-label="Original video preview"
            />
          </div>
        ) : originalUrl ? (
          <PreviewCompare
            originalUrl={originalUrl}
            compressedUrl={compressedUrl}
            originalSize={report.originalBytes}
            compressedSize={report.outputBytes}
          />
        ) : (
          <div className="overflow-hidden rounded-lg bg-black">
            <video
              src={compressedUrl}
              controls
              preload="metadata"
              playsInline
              className="aspect-video w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  tone: 'default' | 'highlight' | 'warning';
}

function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <div className="rounded-lg border border-mist-200 bg-mist-50 p-3 dark:border-mist-800 dark:bg-mist-950/50">
      <p
        className={cn(
          'mono text-sm font-medium',
          tone === 'highlight' && 'text-primary-700 dark:text-primary-300',
          tone === 'warning' && 'text-amber-700 dark:text-amber-400',
          tone === 'default' && 'text-mist-900 dark:text-mist-50'
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs leading-4 text-mist-500 dark:text-mist-400">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-mist-500 dark:text-mist-400">{label}</span>
      <span className="mono text-right text-mist-900 dark:text-mist-100">{value}</span>
    </div>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }
  return formatDuration(ms / 1000);
}

function generateOutputFilename(original: string): string {
  const lastDot = original.lastIndexOf('.');
  const baseName = lastDot > 0 ? original.substring(0, lastDot) : original;
  return `${baseName}_squeezed.mp4`;
}
