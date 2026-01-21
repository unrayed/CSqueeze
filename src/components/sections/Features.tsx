import { motion } from 'framer-motion';
import { Shield, Target, Sliders, Download, Eye, Wifi } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Your Privacy Matters',
    description: 'Your videos never leave your device. Everything happens right in your browser — we literally can\'t see your files!',
    color: 'bg-primary-500',
    bgColor: 'bg-primary-50 dark:bg-primary-950/30',
    emoji: '🔒',
  },
  {
    icon: Target,
    title: 'Hit Your Target Size',
    description: 'Need exactly 8MB for Discord? 25MB for email? Set your limit and we\'ll nail it every time. No guesswork!',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    emoji: '🎯',
  },
  {
    icon: Sliders,
    title: 'Smart Quality Control',
    description: 'We automatically find the sweet spot between size and quality. Want more control? Toggle advanced options!',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    emoji: '✨',
  },
  {
    icon: Download,
    title: 'One-Click Download',
    description: 'No accounts, no sign-ups, no emails. Just compress and download your MP4 instantly. Simple as that!',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    emoji: '⚡',
  },
  {
    icon: Eye,
    title: 'Preview Before Download',
    description: 'Check out your compressed video right in the browser before downloading. Make sure it looks great!',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    emoji: '👀',
  },
  {
    icon: Wifi,
    title: 'Works Offline-ish',
    description: 'Once loaded, the app works without internet. Your videos stay local and compression happens instantly.',
    color: 'bg-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    emoji: '📡',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section id="features" className="section-padding bg-gradient-warm">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-primary mb-4 inline-flex"
          >
            <span className="mr-1">💪</span> Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Why you'll{' '}
            <span className="gradient-text">love</span> ClipSqueeze
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            We built the video compressor we wished existed. Fast, private, and actually easy to use.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`card-playful group ${feature.bgColor} border-0`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${feature.color} text-white shadow-lg`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    {feature.title}
                    <span className="text-xl">{feature.emoji}</span>
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
