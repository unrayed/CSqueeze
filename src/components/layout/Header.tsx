import { useState } from 'react';
import { Menu, X, Moon, Sun, Monitor, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#compressor', label: 'Compressor' },
  { href: '#faq', label: 'FAQ' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-50 border-b border-mist-200/80 bg-mist-50/85 backdrop-blur-md dark:border-mist-800/80 dark:bg-mist-950/85">
      <nav className="container-page flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <img src="/CSqueeze.png" alt="" className="h-8 w-8" />
          <span className="text-base font-medium tracking-tight">CSqueeze</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-mist-600 transition-colors duration-150 ease-out hover:bg-mist-100 hover:text-mist-900 dark:text-mist-300 dark:hover:bg-mist-900 dark:hover:text-mist-50"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded-lg p-2 text-mist-500 transition-colors duration-150 ease-out hover:bg-mist-100 hover:text-mist-900 dark:text-mist-400 dark:hover:bg-mist-900 dark:hover:text-mist-50"
                aria-label="Change theme"
              >
                <ThemeIcon className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[148px] rounded-xl border border-mist-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(11,18,16,0.08)] dark:border-mist-800 dark:bg-mist-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                sideOffset={6}
                align="end"
              >
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <DropdownMenu.Item
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors duration-150 ease-out',
                      'hover:bg-mist-100 focus:bg-mist-100 dark:hover:bg-mist-800 dark:focus:bg-mist-800',
                      theme === value
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-mist-600 dark:text-mist-300'
                    )}
                    onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <a href="#compressor" className="btn-primary hidden sm:inline-flex">
            Compress a video
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </a>

          <button
            className="rounded-lg p-2 text-mist-600 hover:bg-mist-100 hover:text-mist-900 dark:text-mist-300 dark:hover:bg-mist-900 dark:hover:text-mist-50 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-mist-200 bg-mist-50 px-6 py-4 dark:border-mist-800 dark:bg-mist-950 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm text-mist-600 hover:bg-mist-100 dark:text-mist-300 dark:hover:bg-mist-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#compressor"
              className="btn-primary mt-3 w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              Compress a video
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
