import { Heart, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-xl">
                🍋
              </div>
              <span className="text-xl font-extrabold">
                Clip<span className="text-primary-600 dark:text-primary-400">Squeeze</span>
              </span>
            </a>
            <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
              Free, private video compression right in your browser. No uploads, no accounts, no nonsense. 
              Just squeeze your videos to the perfect size! 🍋
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { href: '#features', label: 'Features' },
                { href: '#how-it-works', label: 'How it works' },
                { href: '#compressor', label: 'Compressor' },
                { href: '#faq', label: 'FAQ' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Privacy */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
              Trust & Privacy
            </h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-lg">🔒</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">100% Private</strong><br />
                  Videos never leave your device
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">🌐</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Browser-based</strong><br />
                  Works in Chrome, Edge & Brave
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">💚</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Open Source</strong><br />
                  Transparent and community-driven
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 dark:border-gray-800 sm:flex-row">
          <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
            Made with <Heart className="h-4 w-4 text-red-500" /> for fast, private compression
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} ClipSqueeze. Free forever! 🎉
          </p>
        </div>
      </div>
    </footer>
  );
}
