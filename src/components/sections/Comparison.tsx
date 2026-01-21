import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <X className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
        {value}
      </span>
    </div>
  );
}

export function Comparison() {
  return (
    <section className="section-padding bg-gray-50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-primary mb-4 inline-flex"
          >
            <span className="mr-1">⚖️</span> Comparison
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Why choose{' '}
            <span className="gradient-text">ClipSqueeze?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            See how we stack up against the alternatives.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-6 py-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Feature
                  </th>
                  <th className="bg-primary-50 px-6 py-5 text-center dark:bg-primary-900/20">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">🎯</span>
                      <span className="font-bold text-primary-700 dark:text-primary-300">ClipSqueeze</span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">☁️</span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Cloud Converters</span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">💻</span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Desktop Apps</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index !== comparisons.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
                  >
                    <td className="px-6 py-4 font-medium">{row.feature}</td>
                    <td className="bg-primary-50/50 px-6 py-4 dark:bg-primary-900/10">
                      <StatusCell value={row.clipsqueeze} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusCell value={row.cloudConverters} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusCell value={row.desktopApps} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          * Based on typical free tiers and common desktop software
        </motion.p>
      </div>
    </section>
  );
}
