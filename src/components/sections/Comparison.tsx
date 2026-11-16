import { motion } from 'framer-motion';
import { Check, X, Cloud, Monitor } from 'lucide-react';

const comparisons = [
  {
    feature: 'Free to use',
    clipsqueeze: true,
    cloudConverters: 'limited',
    desktopApps: 'paid',
  },
  {
    feature: 'No file upload',
    clipsqueeze: true,
    cloudConverters: false,
    desktopApps: true,
  },
  {
    feature: '100% private',
    clipsqueeze: true,
    cloudConverters: false,
    desktopApps: true,
  },
  {
    feature: 'No installation',
    clipsqueeze: true,
    cloudConverters: true,
    desktopApps: false,
  },
  {
    feature: 'Target file size',
    clipsqueeze: true,
    cloudConverters: 'limited',
    desktopApps: 'complex',
  },
  {
    feature: 'Works offline',
    clipsqueeze: true,
    cloudConverters: false,
    desktopApps: true,
  },
  {
    feature: 'No watermark',
    clipsqueeze: true,
    cloudConverters: 'limited',
    desktopApps: true,
  },
  {
    feature: 'No account needed',
    clipsqueeze: true,
    cloudConverters: 'limited',
    desktopApps: true,
  },
];

function StatusCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <Check
          className="h-4 w-4 text-primary-700 dark:text-primary-300"
          strokeWidth={1.5}
          aria-label="Yes"
        />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <X
          className="h-4 w-4 text-mist-500 dark:text-mist-400"
          strokeWidth={1.5}
          aria-label="No"
        />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <span className="mono text-xs text-mist-500 dark:text-mist-400">{value}</span>
    </div>
  );
}

export function Comparison() {
  return (
    <section id="comparison" className="scroll-mt-16 section-padding bg-mist-50 dark:bg-mist-950">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Comparison</p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance text-3xl font-medium tracking-[-0.01em] sm:text-4xl"
          >
            How it compares
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-base leading-7 text-mist-600 dark:text-mist-300"
          >
            Against the two usual options: a cloud converter or a desktop app.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.32, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 overflow-hidden rounded-2xl border border-mist-200 bg-white dark:border-mist-800 dark:bg-mist-900"
        >
          <div className="md:hidden">
            <div className="grid grid-cols-3 gap-2 border-b border-mist-200 bg-mist-50/60 px-4 py-3 text-center dark:border-mist-800 dark:bg-mist-950/40">
              <span className="text-xs font-medium text-primary-800 dark:text-primary-200">
                CSqueeze
              </span>
              <span className="text-center text-xs font-medium text-mist-500 dark:text-mist-400">
                Cloud
              </span>
              <span className="text-center text-xs font-medium text-mist-500 dark:text-mist-400">
                Desktop
              </span>
            </div>
            <ul>
              {comparisons.map((row, index) => (
                <li
                  key={row.feature}
                  className={
                    index !== comparisons.length - 1
                      ? 'border-b border-mist-100 px-4 py-3 dark:border-mist-800'
                      : 'px-4 py-3'
                  }
                >
                  <p className="text-sm">{row.feature}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="flex h-8 items-center justify-center rounded-md bg-primary-50/50 dark:bg-primary-900/10">
                      <StatusCell value={row.clipsqueeze} />
                    </div>
                    <div className="flex h-8 items-center justify-center">
                      <StatusCell value={row.cloudConverters} />
                    </div>
                    <div className="flex h-8 items-center justify-center">
                      <StatusCell value={row.desktopApps} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-mist-200 dark:border-mist-800">
                  <th className="px-5 py-4 text-left text-sm font-medium text-mist-500 dark:text-mist-400">
                    Feature
                  </th>
                  <th className="border-t-2 border-primary-700 bg-primary-50/70 px-5 py-4 text-center dark:border-primary-300 dark:bg-primary-900/15">
                    <div className="flex flex-col items-center gap-1.5">
                      <img src="/CSqueeze.png" alt="" className="h-5 w-5" />
                      <span className="text-sm font-medium text-primary-800 dark:text-primary-200">
                        CSqueeze
                      </span>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Cloud
                        className="h-4 w-4 text-mist-500 dark:text-mist-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium text-mist-500 dark:text-mist-400">
                        Cloud converters
                      </span>
                    </div>
                  </th>
                  <th className="px-5 py-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Monitor
                        className="h-4 w-4 text-mist-500 dark:text-mist-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium text-mist-500 dark:text-mist-400">
                        Desktop apps
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={
                      index !== comparisons.length - 1
                        ? 'border-b border-mist-100 dark:border-mist-800'
                        : ''
                    }
                  >
                    <td className="px-5 py-3 text-sm">{row.feature}</td>
                    <td className="bg-primary-50/40 px-5 py-3 dark:bg-primary-900/10">
                      <StatusCell value={row.clipsqueeze} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusCell value={row.cloudConverters} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusCell value={row.desktopApps} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mono mt-4 text-xs leading-5 text-mist-500 dark:text-mist-400">
          Based on typical free tiers and common desktop software
        </p>
      </div>
    </section>
  );
}
