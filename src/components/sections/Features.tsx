import { motion } from 'framer-motion';
import { Shield, Target, Sliders, Download, Eye, Wifi } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Your privacy matters',
    description:
      'Your videos never leave your device. Everything runs in your browser, so there is nothing for us to see or store.',
  },
  {
    icon: Target,
    title: 'Hit your target size',
    description:
      'Need 10 MB for Discord or 25 MB for email? Set the limit and the encoder works to it, lowering the bitrate when a pass comes in over.',
  },
  {
    icon: Sliders,
    title: 'Automatic quality control',
    description:
      'The encoder finds the balance between size and quality. Open advanced settings when you want to choose the resolution or audio bitrate yourself.',
  },
  {
    icon: Download,
    title: 'One-click download',
    description:
      'No account, no sign-up, no email. Compress and download the MP4 as soon as it is ready.',
  },
  {
    icon: Eye,
    title: 'Preview before download',
    description:
      'Watch the result in the browser first, then keep it if it looks right.',
  },
  {
    icon: Wifi,
    title: 'Works offline',
    description:
      'Once the page is loaded, the compressor runs without a network connection. Your video stays local.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 section-padding bg-mist-50 dark:bg-mist-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Features</p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance text-3xl font-medium tracking-[-0.01em] sm:text-4xl"
          >
            Built for files that have to fit
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-base leading-7 text-mist-600 dark:text-mist-300"
          >
            Every option exists for one job: get the file under the limit
            without sending it anywhere.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="rounded-2xl border border-mist-200 bg-white p-6 dark:border-mist-800 dark:bg-mist-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-mist-200 bg-mist-50 dark:border-mist-800 dark:bg-mist-800">
                <feature.icon
                  className="h-4 w-4 text-mist-500 dark:text-mist-400"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mt-4 text-base font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mist-600 dark:text-mist-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
