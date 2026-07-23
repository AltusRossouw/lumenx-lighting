import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { COMPANY } from '../data';
import { ArrowRight, ArrowDown, ShieldCheck, Award, MapPin } from 'lucide-react';

interface HeroSectionProps {
  onScrollTo: (sectionId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollTo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section ref={containerRef} id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-[#06090F]" style={{ minHeight: '100svh' }}>
      {/* Blueprint grid mask */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)',
      }} />

      {/* Light rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="light-ray" style={{ top: '-10%', left: '20%', height: '70%', animationDelay: '0s' }} />
        <div className="light-ray" style={{ top: '-5%', left: '45%', height: '80%', animationDelay: '1.5s' }} />
        <div className="light-ray" style={{ top: '-15%', left: '70%', height: '65%', animationDelay: '3s' }} />
        <div className="light-ray" style={{ top: '-8%', left: '85%', height: '55%', animationDelay: '2s' }} />
      </div>

      {/* LED dot matrix field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`led-${i}`}
            className="led-dot absolute"
            style={{
              left: `${5 + Math.random() * 90}%`,
              top: `${5 + Math.random() * 90}%`,
              ['--led-duration' as string]: `${2 + Math.random() * 3}s`,
              ['--led-delay' as string]: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Circuit traces — horizontal and vertical glowing lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="circuit-trace absolute top-[15%] left-[5%] w-[40%] h-px bg-gradient-to-r from-transparent via-primary/20 to-primary/5" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }} />
        <div className="circuit-trace absolute top-[15%] left-[5%] w-px h-[30%] bg-gradient-to-b from-transparent via-primary/15 to-transparent" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }} />
        <div className="circuit-trace absolute bottom-[25%] right-[10%] w-[35%] h-px bg-gradient-to-l from-transparent via-secondary/15 to-transparent" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }} />
        <div className="circuit-trace absolute bottom-[25%] right-[45%] w-px h-[25%] bg-gradient-to-t from-transparent via-secondary/12 to-transparent" style={{ animationDelay: '1.6s', animationFillMode: 'forwards' }} />
        {/* LED nodes at circuit junctions */}
        <div className="led-dot absolute" style={{ left: '5%', top: '15%', ['--led-duration' as string]: '1.8s', ['--led-delay' as string]: '2s' }} />
        <div className="led-dot absolute" style={{ left: '45%', top: '15%', ['--led-duration' as string]: '2.2s', ['--led-delay' as string]: '1s' }} />
        <div className="led-dot absolute" style={{ right: '45%', bottom: '25%', ['--led-duration' as string]: '2s', ['--led-delay' as string]: '2.5s' }} />
        <div className="led-dot absolute" style={{ right: '10%', bottom: '25%', ['--led-duration' as string]: '2.4s', ['--led-delay' as string]: '0.5s' }} />
      </div>

      {/* Floating light particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="light-particle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              ['--px' as string]: `${(Math.random() - .5) * 120}px`,
              ['--py' as string]: `${-40 - Math.random() * 80}px`,
              ['--particle-dur' as string]: `${2.5 + Math.random() * 4}s`,
              ['--particle-delay' as string]: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <motion.div style={{ y }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-primary/40" />
                <span className="text-[11px] font-mono text-primary tracking-[0.25em] uppercase">South Africa — Nationwide</span>
              </div>
              <h1 className="font-display text-[clamp(2.8rem,7vw,6rem)] font-extrabold tracking-[-0.03em] leading-[0.92] text-white mb-6">
                LIGHTING<br />
                <span className="gradient-text neon-glow">ENGINEERED</span><br />
                <span className="text-white/90">FOR REAL</span><br />
                PROJECTS
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed mb-10 font-sans font-light">
                {COMPANY.intro}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => onScrollTo('contact')} className="group relative overflow-hidden px-8 py-4 bg-primary text-[#06090F] font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer font-display hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] active:glow-burst">
                  <span className="relative z-10 flex items-center gap-2 led-flicker">Start a Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" /></span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
                <button onClick={() => onScrollTo('services')} className="group px-8 py-4 border border-white/10 hover:border-primary/30 text-slate-300 hover:text-white font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer font-display flex items-center gap-2 bg-white/[0.02]">
                  Explore Capabilities <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-5">
              {[
                { icon: MapPin, value: 'Nationwide', label: 'Project Coverage', sub: 'Across South Africa' },
                { icon: ShieldCheck, value: 'B-BBEE 2', label: 'Certified Supplier', sub: 'Level 2 Contributor' },
                { icon: Award, value: 'SABS', label: 'Standards Compliant', sub: 'IEC & OSHACT aligned' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15, duration: 0.7 }} className="gradient-border-card card-lift p-5 flex items-center gap-5">
                  <div className="w-12 h-12 bg-primary/[0.06] flex items-center justify-center shrink-0">
                    <stat.icon className="w-5 h-5 text-primary/60" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white font-display tracking-tight">{stat.value}</p>
                    <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{stat.sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06090F] to-transparent pointer-events-none" />
      <motion.button onClick={() => onScrollTo('overview')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-600 hover:text-primary transition-colors duration-300 cursor-pointer">
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
    </section>
  );
};
