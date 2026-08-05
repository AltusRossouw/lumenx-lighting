import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { COMPLETE_SOLUTION } from '../data';
import { ArrowRight } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const CompleteSolutionSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} id="complete-solution" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
      <PageHeroBackground rays={false} particles={false} dots={false} />
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-6 h-px bg-primary/30" />
            <span className="text-[10px] font-mono text-primary/70 tracking-[0.25em] uppercase">The Complete Solution</span>
            <span className="w-6 h-px bg-primary/30" />
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-5">
            One technical partner manages the complete<br className="hidden sm:block" />
            lighting project from design through to delivery.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed font-sans font-light">
            LumenX brings design, specification, value engineering, supply and project coordination together through one accountable team — ensuring the lighting project is technically sound, commercially practical and ready for site.
          </p>
        </motion.div>

        {/* Process line — horizontal on desktop, vertical on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative"
        >
          {/* Connecting line — desktop */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Step markers */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-0">
            {COMPLETE_SOLUTION.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step number circle */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-[#0E131C] border border-[#1E293B] flex items-center justify-center mb-5 group-hover:border-primary/30 transition-colors duration-500">
                  {/* Connecting dot on the line */}
                  <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_12px_rgba(0,212,255,0.5)] transition-all duration-500" />
                  <span className="font-display text-2xl font-bold text-white/20 group-hover:text-primary/40 transition-colors duration-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Arrow connector between steps on mobile */}
                {i < COMPLETE_SOLUTION.length - 1 && (
                  <div className="lg:hidden flex justify-center mb-2">
                    <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
                  </div>
                )}

                <h3 className="font-display text-lg font-semibold text-white mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                  {cap.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] font-sans font-light">
                  {cap.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
