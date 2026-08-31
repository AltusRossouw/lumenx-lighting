import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useSiteContent } from '../content';
import { ArrowRight } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const HowWeWorkSection: React.FC = () => {
  const { process, processSteps } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} id="how-we-work" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
      <PageHeroBackground rays={false} particles={false} dots={false} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{process.label}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            {process.heading.lead}<span className="gradient-text">{process.heading.accent}</span>{process.heading.tail}
          </h2>
          <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
            {process.subcopy}
          </p>
        </motion.div>

        {/* Numbered steps */}
        <div className="space-y-0">
          {processSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
              className="group relative flex items-start gap-6 sm:gap-10 py-8 border-b border-[#1E293B]/60 last:border-b-0"
            >
              {/* Step number — standard digits, larger and bolder */}
              <div className="shrink-0 w-16 sm:w-28 text-right">
                <span className="font-display text-5xl sm:text-7xl font-extrabold gradient-text leading-none">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={step.iconImg}
                    alt=""
                    className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                  />
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-white tracking-tight group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl font-sans font-light">
                  {step.description}
                </p>
              </div>

              {/* Arrow on hover */}
              <div className="hidden sm:flex items-center shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-5 h-5 text-primary/30" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
