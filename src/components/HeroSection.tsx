import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { COMPANY, LOGO_URL } from '../data';
import { ArrowRight, ArrowDown, ShieldCheck, Globe } from 'lucide-react';
import { LumenXMark } from './ui/lumenx-mark';
import { HeroSlideshow } from './HeroSlideshow';


export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  // Random positions are memoized once per mount so dots/particles don't re-shuffle on re-render.
  const heroDots = useMemo(
    () =>
      Array.from({ length: 18 }).map(() => ({
        left: `${5 + Math.random() * 90}%`,
        top: `${5 + Math.random() * 90}%`,
        duration: `${2.5 + Math.random() * 3}s`,
        delay: `${Math.random() * 5}s`,
      })),
    [],
  );
  const heroParticles = useMemo(
    () =>
      Array.from({ length: 6 }).map(() => ({
        left: `${15 + Math.random() * 70}%`,
        top: `${25 + Math.random() * 50}%`,
        px: `${(Math.random() - 0.5) * 80}px`,
        py: `${-30 - Math.random() * 60}px`,
        duration: `${3 + Math.random() * 4}s`,
        delay: `${Math.random() * 6}s`,
      })),
    [],
  );

  return (
    <section ref={containerRef} id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-[#06090F]" style={{ minHeight: '100svh' }}>
      {/* Installation photography slideshow — full bleed background */}
      <HeroSlideshow />

      {/* Readability overlays — keep left-side copy and centered logo legible */}
      <div className="absolute inset-0 bg-[#06090F]/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06090F] via-[#06090F]/45 to-[#06090F]/10 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#06090F]/85 to-transparent pointer-events-none" />

      {/* Blueprint grid mask — softer */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 70%)',
      }} />

      {/* Light rays — fewer, more subtle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="light-ray" style={{ top: '-10%', left: '25%', height: '60%', animationDelay: '0s', opacity: 0.6 }} />
        <div className="light-ray" style={{ top: '-5%', left: '55%', height: '70%', animationDelay: '2s', opacity: 0.5 }} />
        <div className="light-ray" style={{ top: '-12%', left: '78%', height: '50%', animationDelay: '3.5s', opacity: 0.4 }} />
      </div>

      {/* LED dot matrix field — fewer dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {heroDots.map((dot, i) => (
          <div
            key={`led-${i}`}
            className="led-dot absolute"
            style={{
              left: dot.left,
              top: dot.top,
              ['--led-duration' as string]: dot.duration,
              ['--led-delay' as string]: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Floating light particles — reduced */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {heroParticles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="light-particle"
            style={{
              left: particle.left,
              top: particle.top,
              ['--px' as string]: particle.px,
              ['--py' as string]: particle.py,
              ['--particle-dur' as string]: particle.duration,
              ['--particle-delay' as string]: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Ambient glows — softer */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/[0.02] rounded-full blur-[150px] pointer-events-none" />

      {/* Content */}
      <motion.div style={{ y }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* LumenX logo — centered across the hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-6"
        >
          <img
            src={LOGO_URL}
            alt="LumenX"
            referrerPolicy="no-referrer"
            className="h-32 sm:h-48 lg:h-64 w-auto object-contain drop-shadow-[0_0_35px_rgba(0,212,255,0.25)]"
          />
        </motion.div>

        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            {/* Location badge */}
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-primary/30" />
              <span className="text-[10px] font-mono text-primary/70 tracking-[0.3em] uppercase">South Africa — Nationwide</span>
            </div>

            {/* Headline — smaller and lighter than before, no comma */}
            <h1 className="font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-extrabold tracking-[-0.03em] leading-[1.02] text-slate-300 mb-8 drop-shadow-[0_2px_18px_rgba(6,9,15,0.8)]">
              LIGHTING<br />
              <span className="gradient-text">ENGINEERED</span><br />
              FOR REAL PROJECTS
            </h1>

            {/* Supporting sentence — within easy reading width */}
            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed mb-4 font-sans font-light">
              {COMPANY.intro}
            </p>

            {/* Service tag strip — X marks as separators */}
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] font-mono text-slate-500 tracking-[0.15em] uppercase mb-10">
              Specification
              <LumenXMark className="w-2 h-2 text-primary/50" />
              Value Engineering
              <LumenXMark className="w-2 h-2 text-primary/50" />
              Supply
              <LumenXMark className="w-2 h-2 text-primary/50" />
              Project Coordination and Completion
            </p>

            {/* CTAs — unified button system */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                to="/contact"
                className="btn btn-primary group no-underline"
              >
                <span className="flex items-center gap-2">
                  Discuss a Project
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </Link>
              <Link
                to="/products"
                className="btn btn-outline group no-underline"
              >
                Explore Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              {/* Design Tool temporarily disabled for testing.
                  Re-enable by re-adding:
                  <Link to="/design-tool" className="btn btn-outline group no-underline">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    Design Tool
                  </Link> */}
            </div>

            {/* Trust strip — X marks as separators */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-slate-600" />
                Nationwide Coverage
              </span>
              <LumenXMark className="hidden sm:inline-block w-2 h-2 text-primary/40" />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-slate-600" />
                B-BBEE Level 2
              </span>
              <LumenXMark className="hidden sm:inline-block w-2 h-2 text-primary/40" />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-slate-600" />
                SABS / IEC / OSHACT Aligned
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06090F] to-transparent pointer-events-none" />

      {/* Scroll indicator */}
      <motion.button
        onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-600 hover:text-primary transition-colors duration-300 cursor-pointer"
      >
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
    </section>
  );
};
