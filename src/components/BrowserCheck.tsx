import { useState, useEffect } from 'react';
import { AlertTriangle, X, Chrome } from 'lucide-react';
import {
  cn,
  isAudioWebCodecsSupported,
  isWebCodecsSupported,
  supportsAudioEncoding,
  supportsVideoDecoding,
  supportsVideoEncoding,
} from '../lib/utils';

type WarningType =
  | 'insecure'
  | 'unsupported-browser'
  | 'missing-webcodecs'
  | 'missing-audio';

function isSecureContext(): boolean {
  return (
    window.isSecureContext ??
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  );
}

function isChromiumBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  if (/Firefox|FxiOS/i.test(ua)) return false;
  if (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Brave/i.test(ua)) {
    return false;
  }
  return /Chrome|Chromium|CriOS|Edg|OPR|Brave/i.test(ua);
}

export function BrowserCheck() {
  const [dismissed, setDismissed] = useState(false);
  const [warningType, setWarningType] = useState<WarningType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const wasDismissed = sessionStorage.getItem('browserWarningDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const checkCapabilities = async () => {
      if (!isSecureContext()) {
        if (!cancelled) setWarningType('insecure');
        return;
      }
      if (!isChromiumBrowser()) {
        if (!cancelled) setWarningType('unsupported-browser');
        return;
      }
      if (!isWebCodecsSupported()) {
        if (!cancelled) setWarningType('missing-webcodecs');
        return;
      }

      const [canEncodeVideo, canDecodeVideo] = await Promise.all([
        supportsVideoEncoding(),
        supportsVideoDecoding(),
      ]);

      if (cancelled) return;
      if (!canEncodeVideo || !canDecodeVideo) {
        setWarningType('missing-webcodecs');
        return;
      }
      if (!isAudioWebCodecsSupported()) {
        setWarningType('missing-audio');
        return;
      }

      const canEncodeAudio = await supportsAudioEncoding();
      if (!cancelled && !canEncodeAudio) {
        setWarningType('missing-audio');
      }
    };

    void checkCapabilities();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('browserWarningDismissed', 'true');
  };

  if (dismissed || !warningType) return null;

  const isAudioWarning = warningType === 'missing-audio';
  const showChromeLink =
    warningType === 'unsupported-browser' || warningType === 'missing-webcodecs';

  return (
    <div
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
            />
            <div>
              {warningType === 'insecure' ? (
                <>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Secure connection required
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Compression will not run over an insecure connection. Open
                    this page over HTTPS or on localhost.
                  </p>
                </>
              ) : warningType === 'unsupported-browser' ? (
                <>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Browser not supported
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Compression runs in Chromium only: Chrome, Edge, Brave,
                    Opera, or Chromium. Firefox and Safari are not supported
                    because they do not provide the WebCodecs video encoding
                    this tool needs.
                  </p>
                </>
              ) : warningType === 'missing-webcodecs' ? (
                <>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    WebCodecs unavailable
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This browser cannot decode and encode H.264 video with
                    WebCodecs. Update it, or use a recent Chrome, Edge, Brave,
                    Opera, or Chromium build.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Audio encoding unavailable
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This browser cannot decode and encode AAC audio. Videos
                    without an audio track still work, and you can mute the
                    audio before compressing.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showChromeLink && (
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-300 bg-red-100 px-2.5 text-sm font-medium text-red-900 transition-colors duration-150 ease-out hover:bg-red-200 dark:border-red-800 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900"
              >
                <Chrome className="h-4 w-4" strokeWidth={1.5} />
                Get Chrome
              </a>
            )}
            <button
              onClick={handleDismiss}
              className={cn(
                'rounded-lg p-1.5 transition-colors duration-150 ease-out',
                isAudioWarning
                  ? 'text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50'
                  : 'text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50'
              )}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
