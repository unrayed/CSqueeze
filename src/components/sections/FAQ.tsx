import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: 'Do you upload my video to your servers?',
    answer:
      'No. Everything runs in your browser with WebCodecs, so your files never leave your device. We do not see or store them.',
  },
  {
    question: 'Is this really free? What is the catch?',
    answer:
      'It is free and there is no catch. No accounts, no subscriptions, no paywalls. If we add optional tips later, the core tool stays free.',
  },
  {
    question: 'Why can’t I get perfect quality at 10 MB?',
    answer:
      'Compression is a tradeoff between size and quality. For a 2-minute clip, 10 MB is tight. Try a lower resolution cap, like 720p or 480p, or the Best preset. That usually looks better than squeezing 1080p too hard.',
  },
  {
    question: 'Why does it retry multiple times?',
    answer:
      'Encoding is not perfectly predictable. The final size depends on motion and detail, so the encoder starts with an estimate, checks the result, then adjusts and retries within the selected preset’s pass limit. When it still overshoots, the result warns you and offers a finer retry.',
  },
  {
    question: 'Which browsers are supported?',
    answer:
      'Chrome, Edge, Brave, Opera, and Chromium. Firefox and Safari are not supported because they do not provide the WebCodecs video encoding this tool needs.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'After the page has loaded, compression runs locally and needs no network connection. Opening the page still requires a connection.',
  },
  {
    question: 'What is the maximum file size I can compress?',
    answer:
      'For the smoothest experience, keep videos under 500 MB and under 5 minutes. Files up to 2 GB are accepted, but larger files may be slow or memory heavy.',
  },
  {
    question: 'What happens to audio?',
    answer:
      'Audio is kept when the browser can decode it. If it cannot, the tool reports the problem. You can also mute audio to leave more of the target for video.',
  },
  {
    question: 'Can I use this for commercial projects?',
    answer:
      'Yes. Use it for personal, commercial, or anything else. No attribution required, but a shoutout is always appreciated.',
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      className="scroll-mt-16 section-padding border-t border-mist-200 bg-white dark:border-mist-800 dark:bg-mist-900"
    >
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div>
          <p className="eyebrow">FAQ</p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance text-3xl font-medium tracking-[-0.01em] sm:text-4xl"
          >
            Questions about compression
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.32, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <Accordion.Root type="single" collapsible className="mt-8">
            {faqs.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`item-${index}`}
                className={cn(
                  'border-b border-mist-200 dark:border-mist-800',
                  'data-[state=open]:bg-mist-50 dark:data-[state=open]:bg-mist-950/40'
                )}
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors duration-150 ease-out hover:text-primary-700 dark:hover:text-primary-300">
                    <span className="text-sm font-medium sm:text-base">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-mist-500 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 dark:text-mist-400"
                      strokeWidth={1.5}
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content
                  className={cn(
                    'overflow-hidden text-sm leading-6 text-mist-600 dark:text-mist-300',
                    'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down'
                  )}
                >
                  <p className="pb-4 pr-8">{faq.answer}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>
      </div>
    </section>
  );
}
