import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: 'Do you upload my video to your servers? 🤔',
    answer:
      'No. Everything runs in your browser with WebCodecs, so your files never leave your device. We do not see or store them.',
  },
  {
    question: 'Is this really free? What\'s the catch? 🎁',
    answer:
      'It\'s free and there is no catch. No accounts, no subscriptions, no paywalls. If we add optional tips later, the core tool stays free.',
  },
  {
    question: 'Why can\'t I get perfect quality at 10MB? 📉',
    answer:
      'Compression is a tradeoff between size and quality. For a 2-minute clip, 10MB is tight. Try a lower resolution from the list, like 720p or 480p, and a higher quality setting. That usually looks better than squeezing 1080p too hard.',
  },
  {
    question: 'Why does it retry multiple times? 🔄',
    answer:
      'Encoding is not perfectly predictable. The final size depends on motion and detail, so we start with an estimate, check the result, then lower the bitrate and retry until it fits your target.',
  },
  {
    question: 'Which browsers work best? 🌐',
    answer:
      'Chrome, Edge, and Brave work best. Firefox and Safari are improving but can be limited depending on WebCodecs support.',
  },
  {
    question: 'What\'s the maximum file size I can compress? 📦',
    answer:
      'For the smoothest experience, keep videos under 500MB and under 5 minutes. Larger files can work but may be slow or memory heavy.',
  },
  {
    question: 'What happens to audio? 🔊',
    answer:
      'If your video has AAC audio, we keep it. Other formats might be muted for now. You can also mute audio to save a bit more size.',
  },
  {
    question: 'Can I use this for commercial projects? 💼',
    answer:
      'Yes. Use it for personal, commercial, or anything else. No attribution required, but a shoutout is always appreciated.',
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
            className="mx-auto mt-4 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:text-lg"
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

      </div>
    </section>
  );
}
