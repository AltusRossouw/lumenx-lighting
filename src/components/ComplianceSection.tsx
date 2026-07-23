import { motion } from 'motion/react';
import { COMPLIANCE_ITEMS, WHY_CHOOSE } from '../data';
import { ShieldCheck, Zap, Package, DollarSign, Clock, Briefcase, Factory } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const whyIcons: Record<string, LucideIcon> = {
  Zap,
  Package,
  DollarSign,
  Clock,
  Briefcase,
};

export const ComplianceSection: React.FC = () => {
  return (
    <section id="compliance" className="py-20 sm:py-28 relative bg-[#04070D]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-mono text-xs tracking-[0.3em] uppercase">
            Partnerships & Compliance
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#FFFFFF] mt-3 mb-4 font-display">
            Built on <span className="text-primary">Trust</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Brands & Partners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <Factory className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-[#FFFFFF] font-display">
                Brands & Manufacturing Partners
              </h3>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              LumenX works with trusted manufacturing and supply partners selected for performance, consistency,
              and project suitability.
            </p>
          </motion.div>

          {/* Compliance & Quality */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-[#FFFFFF] font-display">
                Compliance & Quality Assurance
              </h3>
            </div>
            <div className="space-y-4">
              {COMPLIANCE_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="gradient-border-card card-lift p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary stat-pulse" />
                    <h4 className="text-sm font-semibold text-[#FFFFFF] font-display">{item.label}</h4>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed pl-5.5">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Why Choose LumenX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-primary font-mono text-xs tracking-[0.3em] uppercase">
            Why Choose LumenX
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#FFFFFF] mt-3 mb-10 font-display">
            The <span className="text-primary">LumenX</span> Difference
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WHY_CHOOSE.map((reason, i) => {
              const Icon = whyIcons[reason.icon] || Zap;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="gradient-border-card card-lift p-5 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#FFFFFF] mb-2 font-display group-hover:text-primary transition-colors">
                    {reason.title}
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">{reason.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
