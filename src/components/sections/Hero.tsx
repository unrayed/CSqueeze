import { motion } from 'framer-motion';
import { Sparkles, Zap, Lock, PartyPopper } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-white dark:bg-gray-950">

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="text-center">
          {/* Fun badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 dark:bg-primary-900/50"
          >
            <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              100% Free & Private — Your videos stay on your device!
            </span>
            <span className="emoji-wave">👋</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl"
          >
            Squish your videos{' '}
            <span className="gradient-text">to the perfect size</span>
            <br className="hidden sm:block" />
            <span className="mt-2 inline-block">in seconds! ⚡</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl"
          >
            Need to fit that video into Discord's 10MB limit? Email attachment too big? 
            We've got you covered! <span className="font-semibold text-gray-900 dark:text-white">No uploads, no waiting, no nonsense.</span>
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: Lock, label: 'Private & Secure', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' },
              { icon: Zap, label: 'Lightning Fast', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
              { icon: PartyPopper, label: 'Totally Free', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
            ].map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${color}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <a
              href="#compressor"
              className="btn-primary px-8 py-4 text-lg"
            >
              <Sparkles className="h-5 w-5" />
              Start Compressing — It's Free!
            </a>
            <a
              href="#how-it-works"
              className="btn-ghost text-lg"
            >
              See how it works →
            </a>
          </motion.div>

          {/* Social proof hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 text-sm text-gray-500 dark:text-gray-400"
          >
            🎉 Trusted by creators everywhere • Works in Chrome, Edge & Brave
          </motion.p>
        </div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="relative rounded-3xl border border-gray-200 bg-white p-1.5 shadow-2xl ring-1 ring-gray-900/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 rounded-t-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-primary-400" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-white px-4 py-1.5 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                csqueeze.unray.dpdns.org
              </div>
            </div>
            {/* Content preview */}
            <div className="rounded-b-2xl bg-gray-50 p-8 dark:bg-gray-800">
              <div className="flex flex-col items-center justify-center gap-4 py-8 sm:flex-row sm:gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-400">47MB</div>
                  <div className="mt-1 text-sm text-gray-500">Original</div>
                </div>
                <div className="text-4xl text-gray-300">→</div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600 dark:text-primary-400">10MB</div>
                  <div className="mt-1 text-sm text-gray-500">Compressed ✨</div>
                </div>
              </div>
              <div className="mx-auto h-3 max-w-md overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className="h-full rounded-full bg-primary-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-4 text-center text-sm font-medium text-primary-600 dark:text-primary-400">
                79% smaller — Ready for Discord! 🎮
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
