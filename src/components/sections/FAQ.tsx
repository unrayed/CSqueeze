import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: 'Do you upload my video to your servers? 🤔',
    answer:
      'Nope, never! Your video stays 100% on your device. We use WebCodecs technology to process everything right in your browser. We literally cannot see your files — that\'s the whole point! 🔒',
  },
  {
    question: 'Is this really free? What\'s the catch? 🎁',
    answer:
      'It\'s genuinely free with no catch! No accounts, no subscriptions, no "premium" features locked away. We built this because we needed it ourselves and wanted to share it with everyone. Maybe we\'ll add optional tips someday, but the core tool will always be free.',
  },
  {
    question: 'Why can\'t I get perfect quality at 8MB? 📉',
    answer:
      'Video compression is a trade-off between size and quality. When you squeeze a 2-minute video into 8MB, there\'s only so much data to work with! Pro tip: enable "Allow downscale" — a 720p video at good bitrate often looks better than 1080p at potato quality. 🥔',
  },
  {
    question: 'Why does it retry multiple times? 🔄',
    answer:
      'Great question! Video encoding isn\'t perfectly predictable — the output size depends on your video\'s content. So we start with our best estimate, check the result, and if it\'s too big, we automatically lower the quality and try again. This ensures you ALWAYS get a file under your target size. Smart, right? 🧠',
  },
  {
    question: 'Which browsers work best? 🌐',
    answer:
      'We recommend Chrome, Edge, or Brave — basically any Chromium-based browser. These have the best support for WebCodecs, the tech that makes this magic possible. Firefox and Safari are catching up but might not work fully yet.',
  },
  {
    question: 'What\'s the maximum file size I can compress? 📦',
    answer:
      'We recommend videos under 500MB and 5 minutes for the smoothest experience. Bigger files will work, but they might be slow or cause your browser to complain about memory. If you\'re working with huge files, maybe grab a snack while it processes! 🍿',
  },
  {
    question: 'What happens to audio? 🔊',
    answer:
      'If your video has AAC audio (most MP4s do), we keep it as-is. For other audio formats, the current version might mute the audio — we\'re working on improving this! You can also manually mute audio to squeeze out extra file size savings.',
  },
  {
    question: 'Can I use this for commercial projects? 💼',
    answer:
      'Absolutely! Use it for whatever you want — personal, commercial, educational, memes, you name it. No attribution required, though we always appreciate a shoutout! 💚',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="section-padding bg-gradient-playful">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-warm mb-4 inline-flex"
          >
            <MessageCircleQuestion className="mr-1 h-4 w-4" /> FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Got{' '}
            <span className="gradient-text">questions?</span> 🙋
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            We've got answers! Here's everything you need to know.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Accordion.Root type="single" collapsible className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`item-${index}`}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all data-[state=open]:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <span className="text-lg font-semibold">{faq.question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content
                  className={cn(
                    'overflow-hidden text-gray-600 dark:text-gray-400',
                    'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down'
                  )}
                >
                  <p className="px-6 pb-5 leading-relaxed">{faq.answer}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>

        {/* Still have questions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Still have questions?{' '}
            <a href="#" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              Let us know!
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
