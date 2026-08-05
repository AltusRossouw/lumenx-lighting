import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FileDown, FileText, ShieldCheck } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const downloads = [
    { label: 'IES Files', description: 'Photometric data files for lighting simulation software.', href: '/downloads/ies/', icon: FileDown },
    { label: 'Technical Datasheets', description: 'Product specifications, dimensions, and performance data.', href: '/datasheets/', icon: FileText },
    { label: 'Compliance Documentation', description: 'SABS, IEC, and OSHACT compliance certificates.', href: '#', icon: ShieldCheck },
    { label: 'Warranty Terms', description: 'Manufacturer-backed warranty documentation per product range.', href: '#', icon: FileText },
  ];

  return (
    <div className="pt-[88px]">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Technical Resources</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              Documentation and <span className="gradient-text">downloads</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
              Technical datasheets, IES files, compliance documentation, and warranty information for specifiers, engineers, and contractors.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {downloads.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={i}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                  className="gradient-border-card card-lift p-6 group flex items-start gap-5 no-underline cursor-pointer"
                >
                  <div className="w-10 h-10 bg-primary/[0.05] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.1] transition-colors duration-300">
                    <Icon className="w-5 h-5 text-primary/50 group-hover:text-primary/70 transition-colors duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-semibold text-white mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                      {item.label}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{item.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1" />
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
