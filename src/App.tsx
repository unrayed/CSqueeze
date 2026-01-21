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
        <section id="compressor" className="section-padding bg-white dark:bg-gray-950">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="badge-primary mb-4 inline-flex">
                <span className="mr-1">🎬</span> The Tool
              </span>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to <span className="gradient-text">squeeze?</span> 🍋
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Drop your video below and watch the magic happen!
              </p>
            </div>
            <CompressorTool />
          </div>
        </section>
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;
