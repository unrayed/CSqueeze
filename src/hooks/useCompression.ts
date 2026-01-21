import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  VideoMetadata,
  CompressionSettings,
  CompressionProgress,
  CompressionResult,
  WorkerOutputMessage,
} from '../types';

interface UseCompressionReturn {
  metadata: VideoMetadata | null;
  progress: CompressionProgress | null;
  result: CompressionResult | null;
  error: { message: string; suggestion?: string } | null;
  isCompressing: boolean;
  startCompression: (file: File, settings: CompressionSettings) => void;
  cancelCompression: () => void;
  reset: () => void;
}

export function useCompression(): UseCompressionReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const startCompression = useCallback((file: File, settings: CompressionSettings) => {
    // Reset state
    setMetadata(null);
    setProgress(null);
    setResult(null);
    setError(null);
    setIsCompressing(true);

    // Terminate existing worker if any
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // Create new worker
    const worker = new Worker(
      new URL('../workers/compression.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerOutputMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'metadata':
          setMetadata(message.metadata);
          break;

        case 'progress':
          setProgress(message.progress);
          break;

        case 'complete':
          setResult(message.result);
          setProgress({
            stage: 'complete',
            progress: 100,
            currentAttempt: message.result.attempts,
            maxAttempts: 4,
            message: 'Compression complete!',
          });
          setIsCompressing(false);
          break;

        case 'error':
          setError({
            message: message.error,
            ...(message.suggestion ? { suggestion: message.suggestion } : {}),
          });
          setProgress({
            stage: 'error',
            progress: 0,
            currentAttempt: 0,
            maxAttempts: 4,
            message: message.error,
          });
          setIsCompressing(false);
          break;
      }
    };

    worker.onerror = (event) => {
      setError({
        message: event.message || 'Worker error occurred',
        suggestion: 'Try refreshing the page and attempting again.',
      });
      setIsCompressing(false);
    };

    // Read file and send to worker
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        worker.postMessage(
          {
            type: 'compress',
            file: reader.result,
            filename: file.name,
            settings,
          },
          [reader.result] // Transfer buffer to worker
        );
      }
    };
    reader.onerror = () => {
      setError({
        message: 'Failed to read file',
        suggestion: 'Make sure the file is accessible and try again.',
      });
      setIsCompressing(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const cancelCompression = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setProgress({
      stage: 'cancelled',
      progress: 0,
      currentAttempt: 0,
      maxAttempts: 4,
      message: 'Compression cancelled',
    });
    setIsCompressing(false);
  }, []);

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setMetadata(null);
    setProgress(null);
    setResult(null);
    setError(null);
    setIsCompressing(false);
  }, []);

  return {
    metadata,
    progress,
    result,
    error,
    isCompressing,
    startCompression,
    cancelCompression,
    reset,
  };
}
