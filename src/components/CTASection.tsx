import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from './ui/lumenx-button';
import { Section } from './ui/section';
import { SectionLabel } from './ui/typography';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <Section id="cta" variant="dark" backgroundGlow="center">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-4">
            <SectionLabel>Next Step</SectionLabel>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-5 text-balance">
            Bring LumenX into <span className="gradient-text">the project</span>
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed mb-12 font-sans font-light">
            Send us your drawings, BOQ, lighting specification or project brief. Our team will review the requirements and advise on the next technical and commercial step.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button
              size="lg"
              iconTrailing={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/contact')}
            >
              Tell Us About Your Project
            </Button>

            <Button
              variant="secondary"
              size="lg"
              iconLeading={<FileText className="w-4 h-4" />}
              onClick={() => navigate('/contact')}
            >
              Submit Your Lighting Requirement
            </Button>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};
