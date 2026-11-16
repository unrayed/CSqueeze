import { motion } from 'framer-motion';
import { Upload, SlidersHorizontal, Cpu, Download } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Drop your video',
    description:
      'Drag a file in or browse. MP4, MOV, and M4V files are supported.',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Pick your size',
    description:
      'Choose 8 MB, 10 MB, 25 MB, 50 MB, 100 MB, or type any target from 1 to 500 MB.',
  },
  {
    number: '03',
    icon: Cpu,
    title: 'Compress',
    description:
      'The encoder runs in a worker, checks the output size, and retries within the preset’s pass limit. If it cannot reach the target, the result says so.',
  },
  {
    number: '04',
    icon: Download,
    title: 'Compare and download',
    description:
      'Compare the original and compressed video, then download the MP4. Nothing is uploaded at any point.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 section-padding border-y border-mist-200 bg-white dark:border-mist-800 dark:bg-mist-900"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance text-3xl font-medium tracking-[-0.01em] sm:text-4xl"
          >
            Four steps to a smaller file
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-base leading-7 text-mist-600 dark:text-mist-300"
          >
            No learning curve, no complicated settings. Just a target size and a
            result.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.32,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="border-t border-mist-200 pt-5 dark:border-mist-800"
            >
              <div className="flex items-center justify-between">
                <span className="mono text-xs text-mist-500 dark:text-mist-400">
                  {step.number}
                </span>
                <step.icon
                  className="h-4 w-4 text-mist-500 dark:text-mist-400"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mt-4 text-base font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mist-600 dark:text-mist-300">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.32, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12"
        >
          <a href="#compressor" className="btn-primary h-11 px-5">
            Compress a video
          </a>
        </motion.div>
      </div>
    </section>
  );
}
