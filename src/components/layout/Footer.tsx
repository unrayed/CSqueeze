import { Github, Lock, Globe, Code2 } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#compressor', label: 'Compressor' },
  { href: '#faq', label: 'FAQ' },
];

const trustItems = [
  {
    icon: Lock,
    title: '100% private',
    description: 'Videos never leave your device',
  },
  {
    icon: Globe,
    title: 'Browser-based',
    description: 'Runs in Chrome, Edge, Firefox 130+, and Safari 16.4+ (26+ for audio)',
  },
  {
    icon: Code2,
    title: 'Open source',
    description: 'Transparent and community-driven',
  },
];

export function Footer() {
  return (
    <footer className="border-t border-mist-200 bg-mist-50 dark:border-mist-800 dark:bg-mist-950">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <img src="/CSqueeze.png" alt="" className="h-8 w-8" />
              <span className="text-base font-medium tracking-tight">CSqueeze</span>
            </a>
            <p className="mt-4 max-w-md text-sm leading-6 text-mist-600 dark:text-mist-300">
              Free, private video compression in your browser. No uploads, no
              accounts, no watermark. Set a target size and keep the result.
            </p>
            <a
              href="https://github.com/unrayed/CSqueeze"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-mist-200 text-mist-500 transition-colors duration-150 ease-out hover:bg-mist-100 hover:text-mist-900 dark:border-mist-800 dark:text-mist-400 dark:hover:bg-mist-900 dark:hover:text-mist-50"
              aria-label="CSqueeze on GitHub"
            >
              <Github className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>

          <div>
            <h3 className="text-sm font-medium text-mist-900 dark:text-mist-50">
              Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-mist-600 transition-colors duration-150 ease-out hover:text-primary-700 dark:text-mist-300 dark:hover:text-primary-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-mist-900 dark:text-mist-50">
              Trust and privacy
            </h3>
            <div className="mt-4 space-y-4">
              {trustItems.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-2.5">
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-mist-500 dark:text-mist-400"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm leading-5 text-mist-600 dark:text-mist-300">
                    <span className="block font-medium text-mist-900 dark:text-mist-50">
                      {title}
                    </span>
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-mist-200 pt-6 dark:border-mist-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-xs text-mist-500 dark:text-mist-400">
            Made for fast, private compression
          </p>
          <p className="mono text-xs text-mist-500 dark:text-mist-400">
            &copy; {new Date().getFullYear()} CSqueeze
          </p>
        </div>
      </div>
    </footer>
  );
}
