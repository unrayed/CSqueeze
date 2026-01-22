import { motion } from 'framer-motion';
import { Upload, SlidersHorizontal, Download, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Drop your video',
    description: 'Drag and drop any video file or click to browse. We support MP4, MOV, WebM, and more!',
    color: 'bg-pink-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    emoji: '📁',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Pick your size',
    description: 'Choose a preset (8MB, 10MB, 25MB) or enter any custom size. We\'ll handle the math!',
    color: 'bg-amber-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    emoji: '🎚️',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Magic happens',
    description: 'Our smart encoder finds the perfect balance. Watch the progress or grab a coffee ☕',
    color: 'bg-purple-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    emoji: '✨',
  },
  {
    number: '04',
    icon: Download,
    title: 'Download & share!',
    description: 'Preview your compressed video and download with one click. It\'s that simple!',
    color: 'bg-primary-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    emoji: '🎉',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-primary mb-4 inline-flex"
          >
            <span className="mr-1">🛠️</span> How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Four steps to{' '}
            <span className="gradient-text">smaller videos</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            No learning curve, no complicated settings. Just results.
          </motion.p>
        </div>

        <div className="relative mt-12 sm:mt-16">
          {/* Connection line - desktop */}
          <div className="absolute left-0 right-0 top-20 hidden h-1 bg-gray-200 dark:bg-gray-700 lg:block" />

          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step card */}
                <div className={`rounded-3xl ${step.bgColor} p-5 text-center sm:p-6`}>
                  {/* Number badge */}
                  <div className={`mx-auto -mt-10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${step.color} text-lg font-bold text-white shadow-md sm:-mt-12 sm:h-16 sm:w-16 sm:text-xl`}>
                    {step.emoji}
                  </div>

                  {/* Icon */}
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-gray-800 sm:h-14 sm:w-14">
                    <step.icon className="h-7 w-7 text-gray-700 dark:text-gray-300" />
                  </div>

                  {/* Content */}
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Step {step.number}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <a href="#compressor" className="btn-primary w-full px-8 py-4 text-lg sm:w-auto">
            Try It Now Free Forever! 🚀
          </a>
        </motion.div>
      </div>
    </section>
  );
}
