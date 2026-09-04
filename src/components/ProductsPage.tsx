import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PRODUCT_CATEGORIES } from '../data';
import { useSiteContent } from '../content';
import { ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';
import { PageHeroBackground } from './animations';

/* Categories that have a hover "light-up" video. Newer categories use the
   static image only until an animation is produced. */
const HAS_ANIMATION = new Set([
  'bulkheads', 'downlights', 'floods', 'highbays', 'linears',
  'panels', 'strips', 'track', 'vapourproof',
]);

/* ── Category card with hover "light-up" animation ── */
const CategoryCard: React.FC<{ category: (typeof PRODUCT_CATEGORIES)[number]; index: number }> = ({ category, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnter = () => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = 2.5; // light-up completes almost immediately
      v.play().catch(() => {});
    }
  };

  const handleLeave = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
      v.playbackRate = 1;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="group relative overflow-hidden gradient-border-card card-lift flex flex-col"
    >
      {/* Image / light-up animation */}
      <Link to={`/products/${category.id}`} className="aspect-video overflow-hidden relative block bg-black" aria-label={category.title}>
        <img
          src={category.imageUrl}
          alt={category.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {HAS_ANIMATION.has(category.id) && (
          <video
            ref={videoRef}
            src={`/product-images/categories/animations/${category.id}.mp4`}
            poster={category.imageUrl}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          />
        )}
        {/* Ambient glow on hover — the fixture "switches on" */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(0,212,255,0.16), transparent 72%)' }}
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
  );
};

export const ProductsPage: React.FC = () => {
  const { products } = useSiteContent();
  return (
    <div className="min-h-screen">
      {/* Products Hero */}
      <section className="relative pt-[104px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-primary font-mono text-xs tracking-[0.3em] uppercase mb-4 border border-primary/20 rounded-full px-4 py-1.5 bg-primary/5">
              {products.badge}
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 tracking-[-0.02em]">
              {products.heading.lead}<span className="gradient-text">{products.heading.accent}</span>{products.heading.tail}
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-sans font-light">
              {products.subcopy}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Categories Grid */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_CATEGORIES.map((category, i) => (
              <CategoryCard key={category.id} category={category} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Bar */}
      <section className="py-16 bg-[#04070D] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[ShieldCheck, Zap, Clock].map((Icon, i) => {
              const item = products.valueProps[i];
              if (!item) return null;
              return (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white mb-1 tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">{item.description}</p>
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
            {products.quoteCta.heading.lead}<span className="gradient-text">{products.quoteCta.heading.accent}</span>{products.quoteCta.heading.tail}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 font-sans font-light">
            {products.quoteCta.subcopy}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="btn btn-primary group no-underline">
              <span className="flex items-center gap-2">
                {products.quoteCta.button}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link to="/resources" className="btn btn-outline no-underline">
              {products.quoteCta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
