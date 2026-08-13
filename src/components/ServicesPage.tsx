import React from 'react';
import { motion } from 'motion/react';
import { CompleteSolutionSection } from './CompleteSolutionSection';
import { HowWeWorkSection } from './HowWeWorkSection';
import { CTASection } from './CTASection';
import { PageHeroBackground } from './animations';

export const ServicesPage: React.FC = () => {
  return (
    <div className="pt-[88px]">
      {/* Page title */}
      <section className="relative py-20 sm:py-24 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">The Solution</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              One technical partner, <span className="gradient-text">the complete lighting project</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-base leading-relaxed font-sans font-light">
              Design, specification, value engineering, supply and project coordination held by one
              accountable team — technically sound, commercially practical and ready for site.
            </p>
          </motion.div>
        </div>
      </section>

      <CompleteSolutionSection />
      <HowWeWorkSection />
      <CTASection />
    </div>
  );
};
