import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
}

export function FileDropzone({ onFileSelect }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative cursor-pointer rounded-3xl border-3 border-dashed p-12 text-center transition-all duration-300',
        'hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10',
        isDragActive && !isDragReject && 'border-primary-500 bg-primary-50 scale-[1.02] dark:bg-primary-900/20',
        isDragReject && 'border-red-500 bg-red-50 dark:bg-red-900/20',
        !isDragActive && 'border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center">
        {/* Animated icon */}
        <div
          className={cn(
            'mb-6 flex h-20 w-20 items-center justify-center rounded-3xl transition-all duration-300',
            isDragActive && !isDragReject
              ? 'bg-primary-100 text-primary-600 scale-110 dark:bg-primary-900/50 dark:text-primary-400'
              : isDragReject
                ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                : 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
          )}
        >
          {isDragReject ? (
            <Film className="h-10 w-10" />
          ) : isDragActive ? (
            <Sparkles className="h-10 w-10 animate-pulse" />
          ) : (
            <Upload className="h-10 w-10" />
          )}
        </div>

        {/* Text */}
        {isDragReject ? (
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            Oops! Video files only 🎬
          </p>
        ) : isDragActive ? (
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Drop it like it's hot! 🔥
          </p>
        ) : (
          <>
            <p className="text-xl font-bold">
              Drag & drop your video here
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              or <span className="font-semibold text-primary-600 dark:text-primary-400">browse</span> to choose a file
            </p>
          </>
        )}

        {/* Supported formats */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['MP4', 'MOV', 'WebM', 'MKV', 'AVI'].map((format) => (
            <span
              key={format}
              className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              {format}
            </span>
          ))}
        </div>

        {/* Privacy note */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <span>🔒</span>
          Your video stays on your device — we can't see it!
        </div>
      </div>
    </div>
  );
}
