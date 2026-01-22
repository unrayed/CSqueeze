import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Alex Gaming',
    role: 'Content Creator',
    avatar: '🎮',
    content: 'Finally! A tool that actually gets my clips under 8MB for Discord. No more "file too large" errors. This is a game-changer!',
    rating: 5,
  },
  {
    name: 'Sarah M.',
    role: 'Marketing Manager',
    avatar: '💼',
    content: 'I use this daily for email attachments. The fact that files never leave my computer is huge for client confidentiality.',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Freelance Editor',
    avatar: '🎬',
    content: 'Super fast and the quality is surprisingly good even at low file sizes. My go-to for quick compressions.',
    rating: 5,
  },
  {
    name: 'Luna Dev',
    role: 'Software Engineer',
    avatar: '👩‍💻',
    content: 'Love that it uses WebCodecs - real browser tech, not some sketchy upload. The retry mechanism is clever too!',
    rating: 5,
  },
  {
    name: 'Tom Reviews',
    role: 'Tech Blogger',
    avatar: '📱',
    content: 'Tested dozens of compressors. This is the only one that\'s truly private AND free. No catches, no subscriptions.',
    rating: 5,
  },
  {
    name: 'Emma Creative',
    role: 'Social Media Manager',
    avatar: '🎨',
    content: 'Perfect for Instagram and TikTok prep. The target size feature means I never have to guess anymore!',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="section-padding overflow-hidden bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-warm mb-4 inline-flex"
          >
            <span className="mr-1">💬</span> Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          >
            People are{' '}
            <span className="gradient-text">loving it</span> 🥰
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            Join thousands of happy users who compress videos the smart way.
          </motion.p>
        </div>

        {/* Scrolling testimonials */}
        <div className="relative mt-12">
          {/* Gradient masks */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent dark:from-gray-950" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent dark:from-gray-950" />

          <motion.div
            className="flex gap-6"
            animate={{
              x: [0, -1800],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 40,
                ease: 'linear',
              },
            }}
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="w-[280px] shrink-0 rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900 sm:w-[350px]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 text-2xl dark:from-primary-900 dark:to-accent-900">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-gray-600 dark:text-gray-400">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
