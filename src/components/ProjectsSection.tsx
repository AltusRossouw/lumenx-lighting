import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FEATURED_PROJECTS } from '../data';
import { Building2, MapPin, CheckCircle } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const ProjectsSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} id="projects" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
      <PageHeroBackground rays={false} particles={false} dots={false} />
      {/* Section label */}
      <div className="absolute top-12 right-8 sm:right-16 section-number">02</div>

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
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Commercial and Industrial Lighting Projects</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Technical proof, <span className="gradient-text">not promises</span>
          </h2>
          <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
            Every project is supported by lighting design, specification discipline, compliance documentation and coordinated delivery.
          </p>
        </motion.div>

        {/* Featured Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {FEATURED_PROJECTS.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }}
              className="gradient-border-card p-6 sm:p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-primary/50" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-1 tracking-tight">{project.name}</h3>
                  <p className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                    <MapPin className="w-3 h-3" /> {project.location}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] mb-1.5">LumenX Scope</p>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans font-light">{project.scope}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] mb-1.5">Delivered</p>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{project.delivered}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technical proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="border border-[#1E293B] bg-[#0A0F17] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <div className="flex items-center gap-3 shrink-0">
            <CheckCircle className="w-5 h-5 text-primary/60" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Technical Assurance</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono text-slate-400">
            <span>Lighting simulations &amp; calculations</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>B-BBEE Level 2</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>SABS / IEC / OSHACT aligned</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>Manufacturer-backed warranties</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>Technical documentation</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
