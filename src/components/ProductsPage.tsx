import React from 'react';
import { motion } from 'motion/react';
import { PRODUCT_CATEGORIES } from '../data';
import { ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';

interface ProductsPageProps {
  onBackToCompany: () => void;
  onScrollToContact: () => void;
  onSelectCategory: (categoryId: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onBackToCompany, onScrollToContact, onSelectCategory }) => {
  return (
    <div className="min-h-screen">
      {/* Products Hero */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0A0D14] via-[#0F141C] to-[#0A0D14]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-primary font-mono text-xs tracking-[0.3em] uppercase mb-4 border border-primary/20 rounded-full px-4 py-1.5 bg-primary/5"
          >
            Product Portfolio
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif font-semibold text-3xl sm:text-5xl font-normal text-[#FFFFFF] mb-4 tracking-[-0.02em]"
          >
            Lighting <span className="text-primary">Solutions</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#78716C] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            A comprehensive range of fit-for-purpose luminaires and control solutions — from architectural
            interiors to heavy industrial environments. Every product selected for performance, compliance,
            and long-term value.
          </motion.p>
        </div>
      </section>

      {/* Product Categories Grid */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_CATEGORIES.map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                onClick={() => onSelectCategory(category.id)}
                className="group relative overflow-hidden rounded-2xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/20 transition-all duration-300 flex flex-col cursor-pointer card-glow gradient-border"
              >
                {/* Image */}
                <div className="h-52 overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                    style={{ backgroundImage: `url(${category.imageUrl})` }}
                  />
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full bg-primary/10 border border-primary/20 text-primary">
                      Category
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-serif font-semibold text-lg font-semibold text-[#FFFFFF] mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-[#78716C] leading-relaxed flex-grow">
                    {category.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-[#1E293B] flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectCategory(category.id); }}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-[#FFFFFF] transition-colors cursor-pointer group/btn"
                    >
                      View Range
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onScrollToContact(); }}
                      className="text-xs text-[#64748B] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                    >
                      Enquire
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Bar */}
      <section className="py-16 bg-[#04070D] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: 'Industry-Leading Warranties', desc: 'Manufacturer-backed terms up to 8 years, clearly communicated per product range.' },
              { icon: Zap, title: 'Technical Specification Support', desc: 'Expert guidance on luminaire selection, photometric design, and compliance.' },
              { icon: Clock, title: 'Fast Quotation Turnaround', desc: 'Responsive quoting to keep your project moving without delay.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-sm font-semibold text-[#FFFFFF] mb-1 tracking-tight">{item.title}</h4>
                    <p className="text-xs text-[#78716C] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif font-semibold text-2xl sm:text-3xl font-normal text-[#FFFFFF] mb-4 tracking-[-0.02em]">
            Need a <span className="text-primary">Quote</span>?
          </h2>
          <p className="text-[#78716C] text-sm mb-8">
            Tell us about your project and we'll provide a competitive quotation with technical specifications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onScrollToContact}
              className="group relative overflow-hidden px-8 py-3.5 bg-gradient-to-r from-primary to-[#00A8D5] text-[#FFFFFF] font-normal rounded-lg text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Request a Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-[#0A0D14]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            <button
              onClick={onBackToCompany}
              className="px-8 py-3.5 border border-[#1E293B] hover:border-primary/30 text-[#FFFFFF] hover:text-[#FFFFFF] font-medium rounded-lg text-sm transition-all duration-300 cursor-pointer bg-[#0A0D14]/[0.02] hover:bg-[#0A0D14]/[0.04]"
            >
              Back to Company Profile
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
