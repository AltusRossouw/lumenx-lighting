import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { WHY_CHOOSE } from '../data';
import { Users, Zap, TrendingUp, Truck, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeroBackground } from './animations';

const iconMap: Record<string, LucideIcon> = { Users, Zap, TrendingUp, Truck, Headphones };

export const WhyLumenXSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section id="why-lumenx" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
      <PageHeroBackground rays={false} particles={false} dots={false} />
      <div className="section-number top-12 right-8 sm:right-16">04</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-6 h-px bg-primary/30" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Why LumenX</span>
            <span className="w-6 h-px bg-primary/30" />
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            The <span className="gradient-text">LumenX</span> difference
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed font-sans font-light">
            Each differentiator answers: what does LumenX do differently, why does it matter to the project, and what risk or burden does it remove?
          </p>
        </motion.div>

        {/* Why pillars — 5 columns, not card-heavy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5" ref={ref}>
          {WHY_CHOOSE.map((reason, i) => {
            const Icon = iconMap[reason.icon] || Zap;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                className="group"
              >
                {/* Icon + title row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-primary/[0.05] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.1] transition-colors duration-300">
                    <Icon className="w-4 h-4 text-primary/50 group-hover:text-primary/70 transition-colors duration-300" />
                  </div>
                  <div className="w-6 h-px bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300" />
                </div>

                <h3 className="font-display text-sm font-semibold text-white mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                  {reason.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-light">
                  {reason.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
