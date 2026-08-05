import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { ArrowRight, FileText } from 'lucide-react';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="cta" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Ambient glow behind CTA */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[200px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
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

          {/* Three CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
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
              onClick={() => navigate('/contact')}
              className="group px-8 py-4 border border-white/10 hover:border-primary/25 text-slate-300 hover:text-white font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer font-display flex items-center gap-2 bg-white/[0.02]"
            >
              <FileText className="w-4 h-4" />
              Submit Your Lighting Requirement
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade to contact section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#04070D] to-transparent pointer-events-none" />
    </section>
  );
};
