import React from 'react';
import { motion } from 'motion/react';
import { CompleteSolutionSection } from './CompleteSolutionSection';
import { HowWeWorkSection } from './HowWeWorkSection';
import { CTASection } from './CTASection';
import { PageHeroBackground } from './animations';
import { useSiteContent } from '../content';

export const ServicesPage: React.FC = () => {
  const { services } = useSiteContent();
  return (
    <div className="pt-[104px]">
      {/* Page title */}
      <section className="relative py-20 sm:py-24 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              {services.heading.lead}<span className="gradient-text">{services.heading.accent}</span>{services.heading.tail}
            </h1>
            <p className="text-slate-400 max-w-2xl text-base leading-relaxed font-sans font-light">
              {services.subcopy}
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
