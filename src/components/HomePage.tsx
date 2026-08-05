import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { COMPANY } from '../data';
import { ArrowRight, ShieldCheck, Globe } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div>
      {/* Hero */}
      <section ref={containerRef} id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-[#06090F]" style={{ minHeight: '100svh' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 70%)',
        }} />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="light-ray" style={{ top: '-10%', left: '25%', height: '60%', animationDelay: '0s', opacity: 0.6 }} />
          <div className="light-ray" style={{ top: '-5%', left: '55%', height: '70%', animationDelay: '2s', opacity: 0.5 }} />
          <div className="light-ray" style={{ top: '-12%', left: '78%', height: '50%', animationDelay: '3.5s', opacity: 0.4 }} />
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={`led-${i}`} className="led-dot absolute" style={{
              left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%`,
              ['--led-duration' as string]: `${2.5 + Math.random() * 3}s`,
              ['--led-delay' as string]: `${Math.random() * 5}s`,
            }} />
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`particle-${i}`} className="light-particle" style={{
              left: `${15 + Math.random() * 70}%`, top: `${25 + Math.random() * 50}%`,
              ['--px' as string]: `${(Math.random() - .5) * 80}px`,
              ['--py' as string]: `${-30 - Math.random() * 60}px`,
              ['--particle-dur' as string]: `${3 + Math.random() * 4}s`,
              ['--particle-delay' as string]: `${Math.random() * 6}s`,
            }} />
          ))}
        </div>

        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/[0.02] rounded-full blur-[150px] pointer-events-none" />

        <motion.div style={{ y }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center gap-3 mb-10">
                <span className="w-6 h-px bg-primary/30" />
                <span className="text-[10px] font-mono text-primary/70 tracking-[0.3em] uppercase">South Africa — Nationwide</span>
              </div>

              <h1 className="font-display text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold tracking-[-0.03em] leading-[0.94] text-white mb-8">
                LIGHTING,<br />
                <span className="gradient-text">ENGINEERED</span><br />
                FOR REAL PROJECTS
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed mb-4 font-sans font-light">
                {COMPANY.intro}
              </p>

              <p className="text-[11px] font-mono text-slate-500 tracking-[0.15em] uppercase mb-10">
                Specification · Value Engineering · Supply · Project Coordination and Completion
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <button
                  onClick={() => navigate('/contact')}
                  className="group relative overflow-hidden px-8 py-4 bg-primary text-[#06090F] font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer font-display hover:shadow-[0_0_40px_rgba(0,212,255,0.35)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Discuss a Project
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="group px-8 py-4 border border-white/10 hover:border-primary/25 text-slate-300 hover:text-white font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer font-display flex items-center gap-2 bg-white/[0.02]"
                >
                  Explore Products
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-slate-600" />Nationwide Coverage</span>
                <span className="text-slate-700 hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-slate-600" />B-BBEE Level 2</span>
                <span className="text-slate-700 hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-slate-600" />SABS / IEC / OSHACT Aligned</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06090F] to-transparent pointer-events-none" />
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[200px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-6 h-px bg-primary/30" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Next Step</span>
              <span className="w-6 h-px bg-primary/30" />
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-5">
              Bring LumenX into <span className="gradient-text">the project</span>
            </h2>

            <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed mb-12 font-sans font-light">
              Send us your drawings, BOQ, lighting specification or project brief. Our team will review the requirements and advise on the next technical and commercial step.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/contact')}
                className="group relative overflow-hidden px-8 py-4 bg-primary text-[#06090F] font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer font-display hover:shadow-[0_0_40px_rgba(0,212,255,0.35)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Tell Us About Your Project
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <button
                onClick={() => navigate('/services')}
                className="group px-8 py-4 border border-white/10 hover:border-primary/25 text-slate-300 hover:text-white font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer font-display flex items-center gap-2 bg-white/[0.02]"
              >
                Explore Our Services
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
