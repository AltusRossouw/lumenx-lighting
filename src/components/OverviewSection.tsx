import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { COMPANY } from '../data';
import { Target, Eye, Heart, Users } from 'lucide-react';
import { LightBloom } from './animations';

export const OverviewSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  const quickFacts = [
    { label: 'Core Specialisation', value: COMPANY.coreSpecialisation },
    { label: 'Geographic Reach', value: COMPANY.geographicReach },
    { label: 'Market Focus', value: COMPANY.marketFocus },
  ];

  const pillars = [
    { icon: Target, title: 'Mission', text: COMPANY.mission },
    { icon: Eye, title: 'Vision', text: COMPANY.vision },
    { icon: Heart, title: 'Values', text: COMPANY.values },
  ];

  return (
    <section ref={ref} id="overview" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="spotlight" style={{ top: '20%', height: '40%', animationDelay: '2s' }} />
      {/* Section number */}
      <div className="section-number top-8 right-8 sm:right-16">01</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Company Overview & Background</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-6">
            We take <span className="gradient-text">technical ownership</span> of lighting
          </h2>
          <p className="text-slate-400 max-w-2xl text-base leading-relaxed font-sans font-light">
            LumenX was founded to bring stronger technical ownership into lighting delivery. Rather than acting only as a product source, we work as a project partner — aligning design intent, engineering requirements, commercial realities, compliance and on-site execution into one accountable lighting solution.
          </p>
        </motion.div>

        {/* Quick facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {quickFacts.map((fact, i) => (
            <LightBloom key={i} delay={0.1 + i * 0.1} bloomIntensity={0.35}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.7 }}
                className="gradient-border-card card-lift p-6"
              >
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] mb-3 block">{fact.label}</span>
                <p className="text-sm text-slate-300 leading-relaxed font-sans font-light">{fact.value}</p>
              </motion.div>
            </LightBloom>
          ))}
        </div>

        {/* Mission / Vision / Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <LightBloom key={i} delay={0.3 + i * 0.1} bloomIntensity={0.35}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                  className="gradient-border-card card-lift p-6"
                >
                  <div className="w-10 h-10 bg-primary/[0.05] flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-primary/60" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-3 tracking-tight">{p.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{p.text}</p>
                </motion.div>
              </LightBloom>
            );
          })}
        </div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="gradient-border-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start"
        >
          <div className="w-12 h-12 bg-secondary/[0.08] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-secondary/50" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-3 tracking-tight">Our Team</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{COMPANY.team}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
