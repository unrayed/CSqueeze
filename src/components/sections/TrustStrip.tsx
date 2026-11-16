import { Lock, BadgeCheck, Zap, Globe } from 'lucide-react';

const trustItems = [
  { text: 'Files never leave your device', icon: Lock },
  { text: 'No watermarks', icon: BadgeCheck },
  { text: 'Encoded with WebCodecs', icon: Zap },
  { text: 'Chrome, Edge, Brave, Opera', icon: Globe },
];

export function TrustStrip() {
  return (
    <section className="border-b border-mist-200 bg-white dark:border-mist-800 dark:bg-mist-900">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5">
          {trustItems.map(({ text, icon: Icon }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm text-mist-600 dark:text-mist-300"
            >
              <Icon className="h-4 w-4 text-mist-500 dark:text-mist-400" strokeWidth={1.5} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
