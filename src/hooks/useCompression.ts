import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CompressionError,
  CompressionProgress,
  CompressionResult,
  CompressionSettings,
  WorkerOutputMessage,
} from '../types';
import { validateVideoFile } from '../lib/media';

export type CompressionStatus = 'idle' | 'compressing' | 'done' | 'error' | 'cancelled';

interface UseCompressionReturn {
  compress: (file: File, settings: CompressionSettings) => void;
  cancel: () => void;
  reset: () => void;
  progress: CompressionProgress | null;
  result: CompressionResult | null;
  error: CompressionError | null;
  isCompressing: boolean;
  status: CompressionStatus;
}

const CANCEL_ACK_TIMEOUT_MS = 1200;

function emptyProgress(message: string): CompressionProgress {
  return {
    stage: 'idle',
    progress: 0,
    pass: 0,
    passCount: 0,
    passProgress: 0,
    processedFrames: 0,
    totalFrames: 0,
    width: 0,
    height: 0,
    fps: 0,
    elapsedMs: 0,
    etaMs: null,
    message,
  };
}

function cancelledProgress(previous: CompressionProgress | null): CompressionProgress {
  const base = previous ?? emptyProgress('Compression cancelled');
  return {
    ...base,
    stage: 'cancelled',
    passProgress: 0,
    etaMs: null,
    message: 'Compression cancelled',
  };
}

function errorProgress(
  previous: CompressionProgress | null,
  message: string
): CompressionProgress {
  const base = previous ?? emptyProgress(message);
  return {
    ...base,
    stage: 'error',
    etaMs: null,
    message,
  };
}

function completeProgress(
  previous: CompressionProgress | null,
  result: CompressionResult
): CompressionProgress {
  const report = result.report;
  const base = previous ?? emptyProgress('Compression complete');
  return {
    ...base,
    stage: 'complete',
    progress: 100,
    pass: report?.passes ?? base.pass,
    passCount: Math.max(base.passCount, report?.passes ?? 0),
    passProgress: 1,
    processedFrames: base.totalFrames > 0 ? base.totalFrames : base.processedFrames,
    width: report?.width ?? base.width,
    height: report?.height ?? base.height,
    fps: report?.fps ?? base.fps,
    elapsedMs: report?.elapsedMs ?? base.elapsedMs,
    etaMs: 0,
    message: 'Compression complete',
  };
}

function workerFailure(message: string, suggestion?: string): CompressionError {
  return {
    code: 'unknown',
    message,
    ...(suggestion ? { suggestion } : {}),
  };
}

export function useCompression(): UseCompressionReturn {
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<CompressionError | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [status, setStatus] = useState<CompressionStatus>('idle');

  const workerRef = useRef<Worker | null>(null);
  const readerRef = useRef<FileReader | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRequestedRef = useRef(false);
  const jobIdRef = useRef(0);
  const mountedRef = useRef(true);

  const clearCancelTimer = useCallback(() => {
    if (cancelTimerRef.current !== null) {
      clearTimeout(cancelTimerRef.current);
      cancelTimerRef.current = null;
    }
  }, []);

  const terminateWorker = useCallback(() => {
    clearCancelTimer();
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [clearCancelTimer]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      jobIdRef.current += 1;
      if (readerRef.current) {
        readerRef.current.abort();
        readerRef.current = null;
      }
      terminateWorker();
    };
  }, [terminateWorker]);

  const compress = useCallback(
    (file: File, settings: CompressionSettings) => {
      const jobId = jobIdRef.current + 1;
      jobIdRef.current = jobId;

      terminateWorker();
      if (readerRef.current) {
        readerRef.current.abort();
        readerRef.current = null;
      }
      cancelRequestedRef.current = false;

      setProgress(null);
      setResult(null);
      setError(null);
      setStatus('compressing');
      setIsCompressing(true);

      const validation = validateVideoFile(file);
      if (!validation.valid) {
        const compressionError: CompressionError = {
          code: validation.code ?? 'unsupported-container',
          message: validation.error ?? 'That file cannot be compressed.',
          suggestion: 'Choose an MP4, MOV or M4V video and try again.',
        };
        if (!mountedRef.current || jobIdRef.current !== jobId) return;
        setError(compressionError);
        setProgress(errorProgress(null, compressionError.message));
        setStatus('error');
        setIsCompressing(false);
        return;
      }

      let worker: Worker;
      try {
        worker = new Worker(new URL('../workers/compression.worker.ts', import.meta.url), {
          type: 'module',
        });
      } catch (constructError) {
        if (!mountedRef.current || jobIdRef.current !== jobId) return;
        const compressionError = workerFailure(
          `Could not start the compression worker: ${
            constructError instanceof Error ? constructError.message : 'unknown error'
          }`,
          'Refresh the page and try again.'
        );
        setError(compressionError);
        setProgress(errorProgress(null, compressionError.message));
        setStatus('error');
        setIsCompressing(false);
        return;
      }

      workerRef.current = worker;

      const finishCancelled = () => {
        if (!mountedRef.current || jobIdRef.current !== jobId) return;
        clearCancelTimer();
        cancelRequestedRef.current = false;
        terminateWorker();
        setProgress((previous) => cancelledProgress(previous));
        setStatus('cancelled');
        setIsCompressing(false);
      };

      worker.onmessage = (event: MessageEvent<WorkerOutputMessage>) => {
        if (!mountedRef.current || jobIdRef.current !== jobId) return;
        const message = event.data;

        if (message.type === 'progress') {
          if (cancelRequestedRef.current) return;
          setProgress((previous) => {
            if (!previous) return message.progress;
            return {
              ...message.progress,
              progress: Math.max(previous.progress, message.progress.progress),
            };
          });
          return;
        }

        if (message.type === 'cancelled') {
          finishCancelled();
          return;
        }

        if (cancelRequestedRef.current) {
          finishCancelled();
          return;
        }

        if (message.type === 'complete') {
          const compressionResult = message.result;
          if (compressionResult.success && compressionResult.blob && compressionResult.report) {
            terminateWorker();
            setResult(compressionResult);
            setProgress((previous) => completeProgress(previous, compressionResult));
            setError(null);
            setStatus('done');
            setIsCompressing(false);
            return;
          }

          const failure =
            compressionResult.error ??
            workerFailure(
              'Compression finished without producing a file.',
              'Try again with a different target size or resolution.'
            );
          terminateWorker();
          setResult(compressionResult);
          setError(failure);
          setProgress((previous) => errorProgress(previous, failure.message));
          setStatus('error');
          setIsCompressing(false);
          return;
        }

        if (message.type === 'error') {
          terminateWorker();
          setError(message.error);
          setProgress((previous) => errorProgress(previous, message.error.message));
          setStatus('error');
          setIsCompressing(false);
        }
      };

      worker.onerror = (event) => {
        if (!mountedRef.current || jobIdRef.current !== jobId) return;
        if (cancelRequestedRef.current) {
          finishCancelled();
          return;
        }
        const failure = workerFailure(
          event.message || 'The compression worker crashed.',
          'Refresh the page and try again.'
        );
        terminateWorker();
        setError(failure);
        setProgress((previous) => errorProgress(previous, failure.message));
        setStatus('error');
        setIsCompressing(false);
      };

      worker.onmessageerror = () => {
        if (!mountedRef.current || jobIdRef.current !== jobId) return;
        if (cancelRequestedRef.current) {
          finishCancelled();
          return;
        }
        const failure = workerFailure(
          'The compression worker sent an unreadable message.',
          'Refresh the page and try again.'
        );
        terminateWorker();
        setError(failure);
        setProgress((previous) => errorProgress(previous, failure.message));
        setStatus('error');
        setIsCompressing(false);
      };

      const reader = new FileReader();
      readerRef.current = reader;

      reader.onload = () => {
        if (jobIdRef.current !== jobId) return;
        if (!(reader.result instanceof ArrayBuffer)) {
          readerRef.current = null;
          terminateWorker();
          const failure = workerFailure(
            'Could not read that file into memory.',
            'Try selecting the file again.'
          );
          if (!mountedRef.current) return;
          setError(failure);
          setProgress((previous) => errorProgress(previous, failure.message));
          setStatus('error');
          setIsCompressing(false);
          return;
        }
        readerRef.current = null;
        if (cancelRequestedRef.current) return;
        try {
          worker.postMessage(
            {
              type: 'compress',
              file: reader.result,
              filename: file.name,
              settings,
            },
            [reader.result]
          );
        } catch (postError) {
          terminateWorker();
          const failure = workerFailure(
            `Could not send the video to the compression worker: ${
              postError instanceof Error ? postError.message : 'unknown error'
            }`,
            'Try a smaller file or refresh the page.'
          );
          if (!mountedRef.current) return;
          setError(failure);
          setProgress((previous) => errorProgress(previous, failure.message));
          setStatus('error');
          setIsCompressing(false);
        }
      };

      reader.onerror = () => {
        if (jobIdRef.current !== jobId) return;
        readerRef.current = null;
        terminateWorker();
        if (cancelRequestedRef.current) {
          finishCancelled();
          return;
        }
        const failure = workerFailure(
          'Failed to read the video file.',
          'Make sure the file is accessible and try again.'
        );
        if (!mountedRef.current) return;
        setError(failure);
        setProgress((previous) => errorProgress(previous, failure.message));
        setStatus('error');
        setIsCompressing(false);
      };

      reader.onabort = () => {
        if (jobIdRef.current !== jobId) return;
        readerRef.current = null;
      };

      reader.readAsArrayBuffer(file);
    },
    [clearCancelTimer, terminateWorker]
  );

  const cancel = useCallback(() => {
    const worker = workerRef.current;
    if (!worker || cancelRequestedRef.current) return;

    cancelRequestedRef.current = true;
    if (readerRef.current) {
      readerRef.current.abort();
      readerRef.current = null;
    }

    try {
      worker.postMessage({ type: 'cancel' });
    } catch {
      // The worker may already be gone; the timeout below cleans up.
    }

    clearCancelTimer();
    cancelTimerRef.current = setTimeout(() => {
      if (workerRef.current !== worker) return;
      worker.terminate();
      workerRef.current = null;
      cancelTimerRef.current = null;
      cancelRequestedRef.current = false;
      if (!mountedRef.current) return;
      setProgress((previous) => cancelledProgress(previous));
      setStatus('cancelled');
      setIsCompressing(false);
    }, CANCEL_ACK_TIMEOUT_MS);
  }, [clearCancelTimer]);

  const reset = useCallback(() => {
    jobIdRef.current += 1;
    cancelRequestedRef.current = false;
    if (readerRef.current) {
      readerRef.current.abort();
      readerRef.current = null;
    }
    terminateWorker();
    setProgress(null);
    setResult(null);
    setError(null);
    setStatus('idle');
    setIsCompressing(false);
  }, [terminateWorker]);

  return {
    compress,
    cancel,
    reset,
    progress,
    result,
    error,
    isCompressing,
    status,
  };
}
