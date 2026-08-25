import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FEATURED_PROJECTS, INSTALLATION_IMAGES } from '../data';
import { Building2, MapPin, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { PageHeroBackground } from './animations';

/** Prominent case-study card with project photography and anonymous copy. */
const CaseStudyCard: React.FC<{ project: (typeof FEATURED_PROJECTS)[number]; index: number }> = ({ project, index }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ delay: 0.15 + index * 0.15, duration: 0.7 }}
    className="gradient-border-card card-lift overflow-hidden"
  >
    {/* Project photography */}
    <div className="h-64 sm:h-80 relative border-b border-[#1E293B]/60 overflow-hidden bg-[#080D15] group">
      {project.imageUrl ? (
        <>
          <img
            src={project.imageUrl}
            alt={project.imageAlt || project.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-transparent to-transparent" />
          {project.category && (
            <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#06090F]/80 backdrop-blur-sm border border-primary/30 text-[10px] font-mono text-primary uppercase tracking-[0.2em]">
              {project.category}
            </span>
          )}
        </>
      ) : (
        <div className="absolute inset-0 m-4 border border-dashed border-[#1E293B] rounded-lg flex flex-col items-center justify-center gap-3">
          <ImageIcon className="w-8 h-8 text-slate-700" />
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
            Project imagery — to be supplied
          </span>
        </div>
      )}
    </div>

    <div className="p-6 sm:p-10">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/[0.06] flex items-center justify-center shrink-0 mt-0.5">
          <Building2 className="w-6 h-6 text-primary/50" />
        </div>
        <div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
            {project.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <MapPin className="w-3 h-3" /> {project.location}
          </p>
        </div>
      </div>

      {/* Scope + delivered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">LumenX Scope</p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans font-light">{project.scope}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Delivered</p>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans font-light">{project.delivered}</p>
        </div>
      </div>

      {/* Anonymous copy placeholder */}
      <div className="border border-dashed border-[#1E293B] rounded-lg p-4">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] mb-1.5">
          Anonymous client copy — placeholder
        </p>
        <p className="text-xs text-slate-600 font-sans font-light italic">
          Reserved for anonymised client testimonial and project outcome copy.
        </p>
      </div>
    </div>
  </motion.article>
);

export const ProjectsSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} id="projects" className="relative py-20 sm:py-28 overflow-hidden bg-[#06090F]">
      <PageHeroBackground rays={false} particles={false} dots={false} />

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
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Featured Projects</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Technical proof <span className="gradient-text">not promises</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
            Every project is supported by lighting design, specification discipline, compliance
            documentation and coordinated delivery.
          </p>
        </motion.div>

        {/* Featured case studies — one or two prominent cards */}
        <div className="grid grid-cols-1 gap-10 mb-16">
          {FEATURED_PROJECTS.map((project, i) => (
            <CaseStudyCard key={i} project={project} index={i} />
          ))}
        </div>

        {/* Installation applications gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Installation Applications</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em] mb-2">
            Lighting in the <span className="gradient-text">real world</span>
          </h2>
          <p className="text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed font-sans font-light mb-8">
            Typical environments our specifications are engineered for — from facades and retail interiors
            to open-plan workspaces and public concourses.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INSTALLATION_IMAGES.map((img, i) => (
              <motion.figure
                key={img.src}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="gradient-border-card card-lift overflow-hidden group"
              >
                <div className="relative h-52 overflow-hidden bg-[#080D15]">
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06090F]/90 via-transparent to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-[9px] font-mono text-primary uppercase tracking-[0.18em] mb-2">
                      {img.category}
                    </span>
                    <p className="text-xs text-slate-300 font-sans font-light leading-relaxed">
                      {img.application}
                    </p>
                  </figcaption>
                </div>
              </motion.figure>
            ))}
          </div>
        </motion.div>

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
