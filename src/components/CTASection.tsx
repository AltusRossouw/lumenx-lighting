import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useSiteContent } from '../content';

export const CTASection: React.FC = () => {
  const { cta } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="cta" className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
      {/* Ambient glow behind CTA */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[200px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy (left-aligned, single-dash eyebrow) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{cta.label}</span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-5">
              {cta.heading.lead}<span className="gradient-text">{cta.heading.accent}</span>{cta.heading.tail}
            </h2>

            <p className="text-slate-400 max-w-xl text-base leading-relaxed mb-10 font-sans font-light">
              {cta.subcopy}
            </p>

            <Link to="/contact" className="btn btn-primary group no-underline">
              <span className="flex items-center gap-2">
                {cta.button}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Link>
          </motion.div>

          {/* Right — supporting image fills the freed space */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#1E293B]">
              <img
                src="/installation-images/triangular-facade-accent-lighting.jpeg"
                alt="Architectural LED facade illumination at dusk."
                loading="lazy"
                className="w-full h-72 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06090F]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1.5 rounded-full bg-[#06090F]/80 backdrop-blur-sm border border-primary/30 text-[9px] font-mono text-primary uppercase tracking-[0.2em]">
                  Architectural Exterior
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to contact section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#04070D] to-transparent pointer-events-none" />
    </section>
  );
};
