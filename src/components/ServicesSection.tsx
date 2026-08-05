import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { SERVICES } from '../data';
import { Lightbulb, ClipboardCheck, TrendingUp, Truck, Users, Cpu, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LightBloom } from './animations';

const iconMap: Record<string, LucideIcon> = { Lightbulb, ClipboardCheck, TrendingUp, Truck, Users, Cpu, Headphones };

export const ServicesSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} id="services" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Spotlight sweep */}
      <div className="spotlight" style={{ top: '10%', height: '50%', animationDelay: '1s' }} />

      <div className="section-number top-8 left-8 sm:left-16">02</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-16 warm-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Services & Capabilities</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em]">What We <span className="gradient-text neon-glow">Deliver</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s, i) => {
            const Icon = iconMap[s.icon] || Lightbulb;
            return (
              <LightBloom key={i} delay={0.05 + i * 0.06} bloomColor="#00D4FF" bloomIntensity={0.4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.6 }}
                  className="gradient-border-card card-lift p-6 group"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="w-11 h-11 bg-primary/[0.05] flex items-center justify-center mb-5 group-hover:bg-primary/[0.1] transition-colors duration-300">
                    <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary/80 transition-colors duration-300" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-white mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{s.description}</p>
                </motion.div>
              </LightBloom>
            );
          })}
        </div>
      </div>
    </section>
  );
};
