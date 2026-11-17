import { useEffect, useId, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  cn,
  isWebCodecsSupported,
  supportsVideoDecoding,
  supportsVideoEncoding,
} from '../lib/utils';

type WarningType = 'insecure' | 'missing-video' | 'missing-audio-decode';

const DISMISS_KEY = 'browserWarningDismissed';

function isSecureContext(): boolean {
  return (
    window.isSecureContext ??
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  );
}

function supportsAudioDecoding(): boolean {
  return typeof AudioDecoder !== 'undefined' && typeof AudioData !== 'undefined';
}

function wasWarningDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberWarningDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, 'true');
  } catch {
    // Storage can be unavailable in private or restricted modes; dismissal
    // still applies for the current page load.
  }
}

export function BrowserCheck() {
  const [dismissed, setDismissed] = useState(false);
  const [warningType, setWarningType] = useState<WarningType | null>(null);
  const titleId = useId();

  useEffect(() => {
    let cancelled = false;

    if (wasWarningDismissed()) {
      setDismissed(true);
      return;
    }

    const checkCapabilities = async () => {
      if (!isSecureContext()) {
        if (!cancelled) setWarningType('insecure');
        return;
      }

      if (!isWebCodecsSupported()) {
        if (!cancelled) setWarningType('missing-video');
        return;
      }

      const [canEncodeVideo, canDecodeVideo] = await Promise.all([
        supportsVideoEncoding(),
        supportsVideoDecoding(),
      ]);

      if (cancelled) return;

      if (!canEncodeVideo || !canDecodeVideo) {
        setWarningType('missing-video');
        return;
      }

      if (!supportsAudioDecoding()) {
        setWarningType('missing-audio-decode');
      }
    };

    void checkCapabilities();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    rememberWarningDismissed();
  };

  if (dismissed || !warningType) return null;

  const isAudioWarning = warningType === 'missing-audio-decode';
  const isHardFailure = warningType === 'insecure' || warningType === 'missing-video';

  return (
    <div
      role={isHardFailure ? 'alert' : 'status'}
      aria-labelledby={titleId}
      className={cn(
        'border-b',
        isAudioWarning
          ? 'border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40'
          : 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40'
      )}
    >
      <div className="mx-auto max-w-7xl px-6 py-3 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                isAudioWarning
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-red-700 dark:text-red-400'
              )}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div>
              {warningType === 'insecure' ? (
                <>
                  <p
                    id={titleId}
                    className="text-sm font-medium text-red-900 dark:text-red-100"
                  >
                    Secure connection required
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Compression needs HTTPS or localhost. Reopen this page over
                    HTTPS or on localhost.
                  </p>
                </>
              ) : warningType === 'missing-video' ? (
                <>
                  <p
                    id={titleId}
                    className="text-sm font-medium text-red-900 dark:text-red-100"
                  >
                    Video compression not supported
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This browser cannot encode or decode H.264 with WebCodecs.
                    Update it, or use a recent Chrome, Edge, Firefox, or Safari.
                  </p>
                </>
              ) : (
                <>
                  <p
                    id={titleId}
                    className="text-sm font-medium text-amber-900 dark:text-amber-100"
                  >
                    Audio decoding unavailable
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This browser cannot decode source audio. Videos without
                    audio still compress; mute audio before compressing. On
                    Safari before 26, updating to Safari 26+ also works.
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'rounded-lg p-1.5 transition-colors duration-150 ease-out',
              isAudioWarning
                ? 'text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50'
                : 'text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50'
            )}
            aria-label="Dismiss browser capability warning"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
