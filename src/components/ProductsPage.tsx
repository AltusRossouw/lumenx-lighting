import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PRODUCT_CATEGORIES } from '../data';
import { ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const ProductsPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Products Hero */}
      <section className="relative pt-[88px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-primary font-mono text-xs tracking-[0.3em] uppercase mb-4 border border-primary/20 rounded-full px-4 py-1.5 bg-primary/5">
              Product Portfolio
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 tracking-[-0.02em]">
              Lighting <span className="gradient-text">Solutions</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-sans font-light">
              A comprehensive range of fit-for-purpose luminaires and control solutions — from architectural
              interiors to heavy industrial environments. Every product selected for performance, compliance,
              and long-term value.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Categories Grid */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_CATEGORIES.map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="group relative overflow-hidden gradient-border-card card-lift flex flex-col"
              >
                {/* Image */}
                <Link to={`/products/${category.id}`} className="h-52 overflow-hidden relative block" aria-label={category.title}>
                  <img
                    src={category.imageUrl}
                    alt={category.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full bg-primary/10 border border-primary/20 text-primary">
                      Category
                    </span>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <Link to={`/products/${category.id}`} className="block">
                    <h3 className="font-display text-lg font-semibold text-white mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                      {category.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-400 leading-relaxed flex-grow font-sans font-light">
                    {category.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-[#1E293B]/70 flex items-center gap-4">
                    <Link to={`/products/${category.id}`} className="btn btn-outline btn-sm no-underline">
                      View Range
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/contact" className="text-xs text-slate-400 hover:text-primary transition-colors cursor-pointer font-sans">
                      Enquire
                    </Link>
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
                    <h4 className="font-display text-sm font-bold text-white mb-1 tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — unified design */}
      <section className="py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white mb-4 tracking-[-0.02em]">
            Need a <span className="gradient-text">Quote</span>?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 font-sans font-light">
            Tell us about your project and we'll provide a competitive quotation with technical specifications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="btn btn-primary group no-underline">
              <span className="flex items-center gap-2">
                Submit your lighting requirement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link to="/resources" className="btn btn-outline no-underline">
              Technical Resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
