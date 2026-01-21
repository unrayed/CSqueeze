import { X } from 'lucide-react';
import { formatBytes, formatDuration } from '../../lib/utils';
import type { VideoMetadata } from '../../types';

interface VideoInfoProps {
  metadata: VideoMetadata;
  thumbnail: string | null;
  onRemove: () => void;
  disabled?: boolean;
}

export function VideoInfo({ metadata, thumbnail, onRemove, disabled }: VideoInfoProps) {
  return (
    <div className="flex gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
      {/* Thumbnail */}
      <div className="relative h-28 w-44 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-700">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            🎬
          </div>
        )}
        {/* Duration overlay */}
        <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white">
          {formatDuration(metadata.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold" title={metadata.filename}>
            {metadata.filename}
          </h3>
          <button
            onClick={onRemove}
            disabled={disabled}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Remove video"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Metadata grid */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetadataItem icon="📦" label="Size" value={formatBytes(metadata.fileSize)} />
          <MetadataItem icon="📐" label="Resolution" value={`${metadata.width}×${metadata.height}`} />
          <MetadataItem icon="🎞️" label="FPS" value={`${Math.round(metadata.fps)} fps`} />
          <MetadataItem icon="⏱️" label="Duration" value={formatDuration(metadata.duration)} />
        </div>

        {/* Codec badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-lg bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            {metadata.videoCodec.split('.')[0]}
          </span>
          {metadata.hasAudio && metadata.audioCodec && (
            <span className="rounded-lg bg-accent-100 px-2 py-1 text-xs font-medium text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
              {metadata.audioCodec.split('.')[0]} audio
            </span>
          )}
          {!metadata.hasAudio && (
            <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              🔇 No audio
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{icon}</span>
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
