import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useSiteContent } from '../content';
import { PageHeroBackground } from './animations';
import { LumenXMark } from './ui/lumenx-mark';

export const WhoWeWorkWithSection: React.FC = () => {
  const { audience, audienceProfiles, industries } = useSiteContent();
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
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{audience.label}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            {audience.heading.lead}<span className="gradient-text">{audience.heading.accent}</span>{audience.heading.tail}
          </h2>
        </motion.div>

        {/* Audience profiles — 4-column grid, headings designed to stand out on a scan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16" ref={ref}>
          {audienceProfiles.map((profile, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
              className="gradient-border-card p-6"
            >
              <img
                src={profile.iconImg}
                alt=""
                className="w-10 h-10 object-contain mb-4 drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]"
              />
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-white mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                {profile.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{profile.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Sector strip — larger, bolder sector headings for quick scanning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-center"
        >
          <p className="text-[10px] font-mono text-primary/70 uppercase tracking-[0.25em] mb-6">Sectors</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3.5">
            {industries.map((ind, i) => (
              <React.Fragment key={ind.name}>
                {i > 0 && <LumenXMark className="hidden sm:inline-block w-2.5 h-2.5 self-center" />}
                <span className="inline-flex items-center gap-2.5 cursor-default">
                  <img
                    src={ind.iconImg}
                    alt=""
                    className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                  />
                  <span className="font-display text-base sm:text-lg font-bold text-slate-200 hover:text-primary transition-colors duration-300">
                    {ind.name}
                  </span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
