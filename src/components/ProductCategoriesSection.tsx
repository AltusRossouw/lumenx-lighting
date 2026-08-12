import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { PRODUCT_CATEGORIES } from '../data';
import { ArrowRight } from 'lucide-react';

interface ProductCategoriesSectionProps {
  onSelectCategory: (categoryId: string) => void;
}

export const ProductCategoriesSection: React.FC<ProductCategoriesSectionProps> = ({ onSelectCategory }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} id="products" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="section-number top-12 left-8 sm:left-16">03</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Lighting Solutions by Application</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Lighting selected around <span className="gradient-text">the application</span>
          </h2>
          <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
            LumenX supplies commercial, industrial, outdoor, emergency and intelligent lighting systems selected around the technical, operational and commercial requirements of each project.
          </p>
        </motion.div>

        {/* Category grid — alternating image+copy layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PRODUCT_CATEGORIES.map((category, i) => (
            <motion.button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.6 }}
              className="text-left group gradient-border-card card-lift overflow-hidden cursor-pointer"
            >
              {/* Image area */}
              <div className="h-48 overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                  style={{ backgroundImage: `url(${category.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A101A] via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6 relative">
                <h3 className="font-display text-lg font-semibold text-white mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                  {category.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3 font-sans font-light">
                  {category.description}
                </p>
                <p className="text-[11px] font-mono text-slate-600 mb-4">
                  Applications: {category.applications}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/60 group-hover:text-primary transition-colors duration-300">
                  {category.linkLabel} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* OrbitX premium callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-8 p-6 sm:p-8 border border-primary/10 bg-primary/[0.02] flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <div className="shrink-0 w-12 h-12 bg-primary/[0.06] flex items-center justify-center">
            <span className="font-display text-lg font-bold text-primary/60">OX</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-white mb-1 tracking-tight">OrbitX Direct Drive LED Lighting</h3>
            <p className="text-sm text-slate-400 font-sans font-light">
              Premium South African-engineered lighting for demanding industrial, commercial and mining applications requiring advanced performance, durability and lifecycle value.
            </p>
          </div>
          <button
            onClick={() => onSelectCategory('orbitx')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors duration-300 cursor-pointer font-display"
          >
            Explore OrbitX <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
