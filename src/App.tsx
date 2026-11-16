import { Header } from './components/layout/Header';
import { Hero } from './components/sections/Hero';
import { TrustStrip } from './components/sections/TrustStrip';
import { Features } from './components/sections/Features';
import { HowItWorks } from './components/sections/HowItWorks';
import { Comparison } from './components/sections/Comparison';
import { CompressorTool } from './components/compressor/CompressorTool';
import { FAQ } from './components/sections/FAQ';
import { Footer } from './components/layout/Footer';
import { BrowserCheck } from './components/BrowserCheck';

function App() {
  return (
    <div className="min-h-screen">
      <BrowserCheck />
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Comparison />
        <section
          id="compressor"
          className="scroll-mt-16 section-padding bg-white dark:bg-mist-900"
        >
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="max-w-xl">
              <p className="eyebrow">The compressor</p>
              <h2 className="mt-3 text-balance text-3xl font-medium tracking-[-0.01em] sm:text-4xl">
                Compress a video
              </h2>
              <p className="mt-4 text-base leading-7 text-mist-600 dark:text-mist-300">
                Pick a target size. The encoder retries until the file fits, and
                nothing leaves this tab.
              </p>
            </div>
            <div className="mt-10">
              <CompressorTool />
            </div>
          </div>
        </section>
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;
