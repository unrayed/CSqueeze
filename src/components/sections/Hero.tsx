import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ticks = Array.from({ length: 51 }, (_, i) => i);

export function Hero() {
  return (
    <section className="border-b border-mist-200 bg-mist-50 dark:border-mist-800 dark:bg-mist-950">
      <div className="container-page grid items-center gap-14 py-16 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <p className="flex items-center gap-2 text-xs font-medium text-mist-500 dark:text-mist-400">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
            Browser-based video compression
          </p>

          <h1 className="mt-5 max-w-[16ch] text-balance text-4xl font-medium leading-[1.06] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Squeeze a video to the size your upload allows
          </h1>

          <p className="mt-6 max-w-[46ch] text-base leading-7 text-mist-600 dark:text-mist-300 sm:text-lg sm:leading-8">
            Set a target, and CSqueeze re-encodes the file in this tab to fit. If
            the target is out of reach, it says so plainly. The file never
            leaves your device.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#compressor" className="btn-primary h-11 px-5">
              Compress a video
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="#how-it-works" className="btn-secondary h-11 px-5">
              How it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mist-500 dark:text-mist-400">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" strokeWidth={1.5} />
              No uploads
            </span>
            <span className="hidden h-3 w-px bg-mist-300 dark:bg-mist-700 sm:block" />
            <span>No account</span>
            <span className="hidden h-3 w-px bg-mist-300 dark:bg-mist-700 sm:block" />
            <span>Works offline after load</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="relative"
        >
          <div className="rounded-2xl border border-mist-200 bg-white p-5 shadow-[0_8px_24px_rgba(11,18,16,0.06)] dark:border-mist-800 dark:bg-mist-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="mono text-xs text-mist-500 dark:text-mist-400">
                Output target
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-mist-500 dark:text-mist-400">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                On device
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-mist-500 dark:text-mist-400">Original</p>
                <p className="mono mt-1 text-2xl text-mist-500 line-through decoration-mist-400/60 dark:text-mist-400">
                  47.2 MB
                </p>
              </div>
              <span className="mono pb-1 text-sm text-mist-500">&rarr;</span>
              <div className="text-right">
                <p className="text-xs text-mist-500 dark:text-mist-400">Compressed</p>
                <p className="mono mt-1 text-3xl font-medium text-mist-900 dark:text-mist-50">
                  9.8 MB
                </p>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
              79.2% smaller
            </div>

            <div className="relative mt-8 h-16">
              <div className="absolute left-[20%] top-0 flex -translate-x-1/2 flex-col items-center">
                <span className="mono rounded bg-primary-700 px-1.5 py-0.5 text-xs leading-4 text-white dark:bg-primary-300 dark:text-primary-950">
                  10 MB
                </span>
                <span className="mt-1 h-8 w-px bg-primary-700 dark:bg-primary-300" />
              </div>

              <div className="absolute inset-x-0 bottom-0 flex h-8 items-end justify-between">
                {ticks.map((tick) => {
                  const major = tick % 10 === 0;
                  const mid = tick % 5 === 0;
                  return (
                    <span
                      key={tick}
                      className={
                        major
                          ? 'h-3 w-px bg-mist-400 dark:bg-mist-500'
                          : mid
                            ? 'h-2 w-px bg-mist-300 dark:bg-mist-600'
                            : 'h-1 w-px bg-mist-200 dark:bg-mist-700'
                      }
                    />
                  );
                })}
              </div>
            </div>
            <div className="mono mt-1 flex justify-between text-xs text-mist-500 dark:text-mist-400">
              <span>0</span>
              <span>25 MB</span>
              <span>50 MB</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-mist-200 pt-5 dark:border-mist-800">
              <div>
                <p className="text-xs text-mist-500 dark:text-mist-400">Encoder</p>
                <p className="mono mt-1 text-sm">H.264</p>
              </div>
              <div>
                <p className="text-xs text-mist-500 dark:text-mist-400">Passes</p>
                <p className="mono mt-1 text-sm">2 of 4</p>
              </div>
              <div>
                <p className="text-xs text-mist-500 dark:text-mist-400">Upload</p>
                <p className="mono mt-1 text-sm">0 bytes</p>
              </div>
            </div>
          </div>

          <p className="mono mt-3 text-right text-xs text-mist-500 dark:text-mist-400">
            Sample session &middot; 1920&times;1080 &middot; 0:48
          </p>
        </motion.div>
      </div>
    </section>
  );
}
