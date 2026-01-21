import { useState, useEffect } from 'react';
import { AlertTriangle, X, Chrome } from 'lucide-react';
import { isWebCodecsSupported, isChromiumBased } from '../lib/utils';

export function BrowserCheck() {
  const [dismissed, setDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'unsupported' | 'limited' | null>(null);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('browserWarningDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    if (!isWebCodecsSupported()) {
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
    <div className="bg-yellow-50 dark:bg-yellow-900/30">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              {warningType === 'unsupported' ? (
                <>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Browser not supported
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your browser doesn't support WebCodecs, which is required for video compression.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Limited browser support
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    For the best experience, we recommend using Chrome, Edge, or another Chromium-based browser.
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700"
              >
                <Chrome className="h-4 w-4" />
                Get Chrome
              </a>
            )}
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-800"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
