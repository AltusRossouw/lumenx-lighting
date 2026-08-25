import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getCategory, getProductsByCategory } from '../products';
import { ArrowLeft, ArrowRight, Check, Factory } from 'lucide-react';
import { PageHeroBackground } from './animations';

interface ProductDetailPageProps {
  categoryId: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ categoryId }) => {
  const category = getCategory(categoryId);
  const products = getProductsByCategory(categoryId);

  if (!category) {
    return (
      <div className="py-40 text-center text-slate-400">
        <p className="font-display text-xl font-semibold text-white mb-2">Category not found</p>
        <Link to="/products" className="text-primary hover:underline text-sm">Back to all products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Hero */}
      <section className="relative pt-[88px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 cursor-pointer group font-sans"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to all products
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-primary font-mono text-xs tracking-[0.3em] uppercase mb-4 border border-primary/20 rounded-full px-4 py-1.5 bg-primary/5">
              {products.length} Products
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 tracking-[-0.02em]">
              {category.title}
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed font-sans font-light">
              {category.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products List */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <div className="text-center p-16 rounded-2xl bg-[#0A0D14] border border-[#1E293B]">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 tracking-[-0.02em]">
                Range details coming soon
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto font-sans font-light">
                Product specifications for this range are being finalised. Contact our technical team
                for current availability, performance data and lead times.
              </p>
              <Link to="/contact" className="btn btn-primary group inline-flex">
                <span className="flex items-center gap-2">
                  Request Information
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product, i) => (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group overflow-hidden rounded-2xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/20 transition-all duration-300 card-glow gradient-border card-lift flex flex-col"
                >
                  {/* Image */}
                  <Link
                    to={`/products/${category.id}/${product.slug}`}
                    className={`relative h-56 overflow-hidden block ${
                      product.imageUrl.startsWith('/product-images/') ? 'bg-white' : ''
                    }`}
                    aria-label={product.name}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className={`absolute inset-0 w-full h-full ${
                        product.imageUrl.startsWith('/product-images/')
                          ? 'object-contain p-4'
                          : 'object-cover group-hover:scale-105'
                      } transition-transform duration-700`}
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#06090F]/80 backdrop-blur border border-white/10 text-[10px] font-mono uppercase tracking-wider text-primary">
                      <Factory className="w-3 h-3" />
                      {product.supplier}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <Link to={`/products/${category.id}/${product.slug}`} className="block">
                      <h3 className="font-display text-lg font-bold text-white mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-400 leading-relaxed flex-grow font-sans font-light">
                      {product.summary}
                    </p>

                    {/* Key specs preview */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {product.specs.slice(0, 4).map((spec) => (
                        <div key={spec.label} className="px-2.5 py-1.5 rounded-md bg-white/[0.02] border border-[#1E293B]/60">
                          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{spec.label}</p>
                          <p className="text-[11px] text-white font-medium truncate">{spec.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Applications */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {product.applications.slice(0, 3).map((app) => (
                        <span
                          key={app}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-[10px] text-primary font-mono"
                        >
                          <Check className="w-2.5 h-2.5" />
                          {app}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1E293B]/70 flex items-center justify-between">
                      <Link
                        to={`/products/${category.id}/${product.slug}`}
                        className="btn btn-outline btn-sm no-underline group/btn"
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        to="/contact"
                        className="text-xs text-slate-400 hover:text-primary transition-colors cursor-pointer font-sans"
                      >
                        Enquire
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 text-center p-10 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B]"
          >
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 tracking-[-0.02em]">
              Need a tailored solution?
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto font-sans font-light">
              Our technical team can help specify the right products for your project. Get a competitive quote with lead times and compliance documentation.
            </p>
            <Link to="/contact" className="btn btn-primary group inline-flex no-underline">
              <span className="flex items-center gap-2">
                Request a Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
