// Icons replaced with emojis for playful feel
import { motion } from 'framer-motion';

const trustItems = [
  {
    text: 'Your videos never leave your device',
    emoji: '🔐',
  },
  {
    text: 'No watermarks, ever',
    emoji: '🎁',
  },
  {
    text: 'Lightning-fast processing',
    emoji: '⚡',
  },
  {
    text: 'Works in Chrome, Edge & Brave',
    emoji: '🌐',
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {trustItems.map(({ text, emoji }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <span className="text-lg">{emoji}</span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
