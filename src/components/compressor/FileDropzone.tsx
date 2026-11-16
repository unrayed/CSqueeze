import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, Lock } from 'lucide-react';
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
        'cursor-pointer rounded-xl border border-dashed p-8 text-center',
        'transition-colors duration-150 ease-out',
        'border-mist-300 bg-white hover:border-primary-600 hover:bg-primary-50/40',
        'dark:border-mist-700 dark:bg-mist-900 dark:hover:border-primary-400 dark:hover:bg-primary-900/10',
        isDragActive &&
          !isDragReject &&
          'border-primary-600 bg-primary-50/60 dark:border-primary-400 dark:bg-primary-900/20',
        isDragReject &&
          'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/30'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border',
            'border-mist-200 bg-mist-50 text-mist-500 dark:border-mist-700 dark:bg-mist-800 dark:text-mist-400',
            isDragActive &&
              !isDragReject &&
              'border-primary-200 bg-primary-100 text-primary-700 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
            isDragReject &&
              'border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-900/40 dark:text-red-300'
          )}
        >
          {isDragReject ? (
            <Film className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Upload className="h-4 w-4" strokeWidth={1.5} />
          )}
        </div>

        {isDragReject ? (
          <p className="mt-5 text-base font-medium text-red-700 dark:text-red-300">
            Video files only
          </p>
        ) : isDragActive ? (
          <p className="mt-5 text-base font-medium text-primary-700 dark:text-primary-300">
            Drop to add the file
          </p>
        ) : (
          <>
            <p className="mt-5 text-base font-medium">Drop your video here</p>
            <p className="mt-1 text-sm text-mist-500 dark:text-mist-400">
              or{' '}
              <span className="font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 dark:text-primary-300 dark:decoration-primary-700">
                browse files
              </span>
            </p>
          </>
        )}

        <p className="mono mt-5 text-xs text-mist-500 dark:text-mist-400">
          MP4 &middot; MOV &middot; WebM &middot; MKV &middot; AVI
        </p>

        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-mist-500 dark:text-mist-400">
          <Lock className="h-4 w-4" strokeWidth={1.5} />
          Your video stays on your device
        </p>
      </div>
    </div>
  );
}
