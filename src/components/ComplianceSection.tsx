import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { COMPLIANCE_ITEMS, COMPANY } from '../data';
import { ShieldCheck, Factory } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const ComplianceSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Brands & Partners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-secondary/[0.06] flex items-center justify-center">
                <Factory className="w-5 h-5 text-secondary/50" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white tracking-tight">
                Brands & Manufacturing Partners
              </h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 font-sans font-light">
              LumenX works with trusted manufacturing and supply partners selected for performance, consistency, and project suitability.
            </p>

            {/* About LumenX — brief */}
            <div className="mt-8 pt-8 border-t border-[#1E293B]/60">
              <h3 className="font-display text-lg font-semibold text-white mb-3 tracking-tight">About LumenX</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">
                LumenX is a technically driven lighting business founded to bring stronger technical ownership into lighting delivery. Rather than acting only as a product source, we work as a project partner — aligning design intent, engineering requirements, commercial realities, compliance and on-site execution into one accountable lighting solution.
              </p>
            </div>
          </motion.div>

          {/* Compliance & Quality */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/[0.06] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary/50" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white tracking-tight">
                Compliance & Quality Assurance
              </h3>
            </div>
            <div className="space-y-4">
              {COMPLIANCE_ITEMS.map((item, i) => (
                <div key={i} className="gradient-border-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary/50" />
                    <h4 className="text-sm font-semibold text-white font-display">{item.label}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pl-5.5 font-sans font-light">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
