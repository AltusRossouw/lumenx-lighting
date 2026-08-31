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
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{cta.label}</span>
            <span className="w-6 h-px bg-primary/30" />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-5">
            {cta.heading.lead}<span className="gradient-text">{cta.heading.accent}</span>{cta.heading.tail}
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed mb-12 font-sans font-light">
            {cta.subcopy}
          </p>

          {/* CTA buttons — unified button system */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/contact"
              className="btn btn-primary group no-underline"
            >
              <span className="flex items-center gap-2">
                {cta.button}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade to contact section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#04070D] to-transparent pointer-events-none" />
    </section>
  );
};
