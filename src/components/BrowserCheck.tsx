import { useState, useEffect } from 'react';
import { AlertTriangle, X, Chrome } from 'lucide-react';
import { isWebCodecsSupported, isChromiumBased } from '../lib/utils';

function isSecureContext(): boolean {
  return window.isSecureContext ?? (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

export function BrowserCheck() {
  const [dismissed, setDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'unsupported' | 'limited' | 'insecure' | null>(null);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('browserWarningDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    if (!isSecureContext()) {
      setWarningType('insecure');
      setShowWarning(true);
    } else if (!isWebCodecsSupported()) {
      setWarningType('unsupported');
      setShowWarning(true);
    } else if (!isChromiumBased()) {
      setWarningType('limited');
      setShowWarning(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('browserWarningDismissed', 'true');
  };

  if (dismissed || !showWarning) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40">
      <div className="mx-auto max-w-7xl px-6 py-3 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
              strokeWidth={1.5}
            />
            <div>
              {warningType === 'insecure' ? (
                <>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    HTTPS required
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Video compression needs a secure connection. Open this site
                    over HTTPS or on localhost.
                  </p>
                </>
              ) : warningType === 'unsupported' ? (
                <>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Browser not supported
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Your browser does not support WebCodecs, which video
                    compression needs.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Limited browser support
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    For the best experience, use Chrome, Edge, or another
                    Chromium-based browser.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {warningType === 'unsupported' && (
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-2.5 text-sm font-medium text-amber-900 transition-colors duration-150 ease-out hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-100 dark:hover:bg-amber-900"
              >
                <Chrome className="h-4 w-4" strokeWidth={1.5} />
                Get Chrome
              </a>
            )}
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-amber-700 transition-colors duration-150 ease-out hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
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
