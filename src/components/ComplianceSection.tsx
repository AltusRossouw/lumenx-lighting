import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { COMPLIANCE_ITEMS } from '../data';
import { ShieldCheck, Factory } from 'lucide-react';
import { PageHeroBackground } from './animations';
import { LumenXWordmark } from './ui/lumenx-wordmark';

export const ComplianceSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="compliance" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
      <PageHeroBackground rays={false} particles={false} dots={false} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Compliance & Technical Assurance</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Standards and <span className="gradient-text">quality</span> you can rely on
          </h2>
        </motion.div>

        {/* About LumenX — body text sits directly under the header, no standalone heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="max-w-3xl mb-16"
        >
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans font-light">
            <LumenXWordmark className="h-[1.1em]" /> started with one idea: lighting projects need stronger
            technical ownership. We're not just a product source. We work as a project partner — tying
            together design intent, engineering, budget, compliance and site execution into one
            accountable solution.
          </p>
        </motion.div>

        {/* Brands & Manufacturing Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary/[0.06] flex items-center justify-center">
              <Factory className="w-5 h-5 text-secondary/50" />
            </div>
            <h3 className="font-display text-xl font-semibold text-white tracking-tight">
              Brands & Manufacturing Partners
            </h3>
          </div>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl font-sans font-light">
            <LumenXWordmark className="h-[1em]" /> works with manufacturing and supply partners chosen
            for performance, consistency and project fit.
          </p>
        </motion.div>

        {/* Compliance & Quality Assurance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/[0.06] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary/50" />
            </div>
            <h3 className="font-display text-xl font-semibold text-white tracking-tight">
              Compliance & Quality Assurance
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPLIANCE_ITEMS.map((item, i) => (
              <div key={i} className="gradient-border-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary/50" />
                  <h4 className="text-sm font-semibold text-white font-display">{item.label}</h4>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed pl-5.5 font-sans font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
