import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Alex Gaming',
    role: 'Content creator',
    content:
      'Finally, a tool that actually gets my clips under 8 MB for Discord. No more “file too large” errors.',
  },
  {
    name: 'Sarah M.',
    role: 'Marketing manager',
    content:
      'I use this daily for email attachments. The fact that files never leave my computer is huge for client confidentiality.',
  },
  {
    name: 'Mike Chen',
    role: 'Freelance editor',
    content:
      'Fast, and the quality is surprisingly good even at low file sizes. My go-to for quick compressions.',
  },
  {
    name: 'Luna Dev',
    role: 'Software engineer',
    content:
      'It uses WebCodecs, real browser tech, not some sketchy upload. The retry mechanism is clever too.',
  },
  {
    name: 'Tom Reviews',
    role: 'Tech blogger',
    content:
      'I have tested dozens of compressors. This is the only one that is truly private and free. No catches.',
  },
  {
    name: 'Emma Creative',
    role: 'Social media manager',
    content:
      'Perfect for Instagram and TikTok prep. The target size feature means I never have to guess anymore.',
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="section-padding border-t border-mist-200 bg-mist-50 dark:border-mist-800 dark:bg-mist-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Testimonials</p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance text-3xl font-medium tracking-[-0.01em] sm:text-4xl"
          >
            What people use it for
          </motion.h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.figure
              key={testimonial.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.32,
                delay: Math.min(index, 5) * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-2xl border border-mist-200 bg-white p-6 dark:border-mist-800 dark:bg-mist-900"
            >
              <blockquote className="text-sm leading-6 text-mist-600 dark:text-mist-300">
                {testimonial.content}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="mono flex h-8 w-8 items-center justify-center rounded-full border border-mist-200 bg-mist-50 text-xs text-mist-500 dark:border-mist-700 dark:bg-mist-800 dark:text-mist-400">
                  {initials(testimonial.name)}
                </div>
                <div>
                  <div className="text-sm font-medium">{testimonial.name}</div>
                  <div className="text-xs text-mist-500 dark:text-mist-400">
                    {testimonial.role}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
