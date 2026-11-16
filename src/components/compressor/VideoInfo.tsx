import {
  X,
  Film,
  HardDrive,
  Monitor,
  Gauge,
  Clock,
  RotateCw,
  type LucideIcon,
} from 'lucide-react';
import { formatBytes, formatDuration } from '../../lib/utils';
import type { VideoMetadata } from '../../types';

interface VideoInfoProps {
  metadata: VideoMetadata;
  thumbnail: string | null;
  onRemove: () => void;
  disabled?: boolean;
}

export function VideoInfo({ metadata, thumbnail, onRemove, disabled }: VideoInfoProps) {
  const videoCodec = metadata.videoCodec.split('.')[0] ?? metadata.videoCodec;
  const audioCodec = metadata.audioCodec
    ? metadata.audioCodec.split('.')[0] ?? metadata.audioCodec
    : null;
  const audioDetails = [
    metadata.audioChannels !== null ? `${metadata.audioChannels} ch` : null,
    metadata.audioSampleRate !== null
      ? `${Math.round(metadata.audioSampleRate / 1000)} kHz`
      : null,
  ].filter((value): value is string => value !== null);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-mist-200 bg-white p-3 dark:border-mist-800 dark:bg-mist-900 sm:flex-row">
      <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-lg bg-mist-100 dark:bg-mist-800 sm:h-28 sm:w-44">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-mist-500 dark:text-mist-400">
            <Film className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
        <div className="mono absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs leading-4 text-white">
          {formatDuration(metadata.duration)}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-medium" title={metadata.filename}>
            {metadata.filename}
          </h3>
          <button
            onClick={onRemove}
            disabled={disabled}
            className="flex-shrink-0 rounded-md p-1 text-mist-500 transition-colors duration-150 ease-out hover:bg-mist-100 hover:text-mist-700 disabled:opacity-50 dark:hover:bg-mist-800 dark:hover:text-mist-200"
            aria-label="Remove video"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <MetadataItem icon={HardDrive} label="Size" value={formatBytes(metadata.fileSize)} />
          <MetadataItem icon={Monitor} label="Resolution" value={`${metadata.width}×${metadata.height}`} />
          <MetadataItem icon={Gauge} label="Frame rate" value={`${Math.round(metadata.fps)} fps`} />
          <MetadataItem icon={Clock} label="Duration" value={formatDuration(metadata.duration)} />
        </div>

        <div className="mono mt-3 flex flex-wrap items-center gap-2 text-xs text-mist-500 dark:text-mist-400">
          <span className="rounded-md border border-mist-200 px-1.5 py-0.5 dark:border-mist-700">
            {videoCodec}
          </span>
          {metadata.hasAudio ? (
            <span className="rounded-md border border-mist-200 px-1.5 py-0.5 dark:border-mist-700">
              {audioCodec ?? 'Audio'} audio
              {audioDetails.length > 0 ? ` · ${audioDetails.join(' · ')}` : ''}
            </span>
          ) : (
            <span>No audio</span>
          )}
          {metadata.rotation !== 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-mist-200 px-1.5 py-0.5 dark:border-mist-700">
              <RotateCw className="h-3 w-3" strokeWidth={1.5} />
              Rotated {metadata.rotation}°
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        className="h-4 w-4 shrink-0 text-mist-500 dark:text-mist-400"
        strokeWidth={1.5}
      />
      <span className="text-mist-500 dark:text-mist-400">{label}</span>
      <span className="mono ml-auto text-mist-900 dark:text-mist-100 sm:ml-0">{value}</span>
    </div>
  );
}
