import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { AUDIENCE_PROFILES, INDUSTRIES } from '../data';
import { Building2 } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const WhoWeWorkWithSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section id="who-we-work-with" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
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
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Built for the Teams Delivering the Project</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Lighting across <span className="gradient-text">demanding environments</span>
          </h2>
        </motion.div>

        {/* Audience profiles — 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16" ref={ref}>
          {AUDIENCE_PROFILES.map((profile, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
              className="gradient-border-card p-6"
            >
              <h3 className="font-display text-base font-semibold text-white mb-3 tracking-tight">{profile.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{profile.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Sector strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-center"
        >
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.25em] mb-6">Sectors</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {INDUSTRIES.map((ind) => (
              <span key={ind.name} className="text-sm text-slate-400 font-sans font-light">
                {ind.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
