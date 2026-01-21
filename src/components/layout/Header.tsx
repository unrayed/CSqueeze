import { useState } from 'react';
import { Menu, X, Sparkles, Moon, Sun, Monitor } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="group flex items-center gap-2">
          <img
            src="/CSqueeze.png"
            alt="ClipSqueeze"
            className="h-10 w-10 transition-transform group-hover:scale-105"
          />
          <span className="text-xl font-extrabold">
            Clip<span className="text-primary-600 dark:text-primary-400">Squeeze</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side - Theme toggle & CTA */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label="Toggle theme"
              >
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'system' && <Monitor className="h-5 w-5" />}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[140px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    theme === 'light' && 'text-primary-600 dark:text-primary-400'
                  )}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    theme === 'dark' && 'text-primary-600 dark:text-primary-400'
                  )}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    theme === 'system' && 'text-primary-600 dark:text-primary-400'
                  )}
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4" />
                  System
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* CTA Button - Desktop */}
          <a
            href="#compressor"
            className="btn-primary hidden px-5 py-2.5 text-sm sm:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            Start Free
          </a>

          {/* Mobile menu button */}
          <button
            className="rounded-xl p-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#compressor"
              className="btn-primary mt-2 justify-center text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="h-4 w-4" />
              Start Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
