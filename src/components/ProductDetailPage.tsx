import React from 'react';
import { motion } from 'motion/react';
import { PRODUCT_CATEGORIES, PRODUCTS_BY_CATEGORY } from '../data';
import { ArrowLeft, ArrowRight, Check, FileDown, FileText } from 'lucide-react';
import { PageHeroBackground } from './animations';

/** Generate a URL-safe slug from a product name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Generate download URLs for a product */
function getDownloadUrls(product: { name: string; pdfUrl?: string; iesUrl?: string }) {
  const slug = slugify(product.name);
  return {
    pdf: product.pdfUrl || `/downloads/specs/${slug}.pdf`,
    ies: product.iesUrl || `/downloads/ies/${slug}.ies`,
  };
}

interface ProductDetailPageProps {
  categoryId: string;
  onBack: () => void;
  onInquire: (productName: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ categoryId, onBack, onInquire }) => {
  const category = PRODUCT_CATEGORIES.find((c) => c.id === categoryId);
  const products = PRODUCTS_BY_CATEGORY[categoryId] || [];

  if (!category) {
    return (
      <div className="py-40 text-center text-slate-400">Category not found.</div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Hero */}
      <section className="relative pt-[88px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 cursor-pointer group font-sans"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to all products
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block text-primary font-mono text-xs tracking-[0.3em] uppercase mb-4 border border-primary/20 rounded-full px-4 py-1.5 bg-primary/5">
              Product Range
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
          <div className="space-y-8">
            {products.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="overflow-hidden rounded-2xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/10 transition-all duration-300 card-glow gradient-border"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  {/* Image */}
                  <div className="h-56 lg:h-full relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${product.imageUrl})` }}
                    />
                  </div>

                  {/* Content */}
                  <div className="lg:col-span-2 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                      <div>
                        <h3 className="font-display text-xl font-bold text-white mb-2 tracking-tight">{product.name}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl font-sans font-light">{product.description}</p>
                      </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {product.specs.map((spec, j) => (
                        <div key={j} className="p-3 rounded-lg bg-[#0A0D14] border border-[#1E293B]">
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">{spec.label}</p>
                          <p className="text-xs text-white font-medium">{spec.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Applications */}
                    <div className="mb-6">
                      <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Applications</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.applications.map((app, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10 text-[11px] text-primary font-mono"
                          >
                            <Check className="w-3 h-3" />
                            {app}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA — unified buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => onInquire(product.name)}
                        className="btn btn-primary btn-sm"
                      >
                        Enquire about {product.name}
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {(() => {
                        const urls = getDownloadUrls(product);
                        return (
                          <>
                            <a
                              href={urls.pdf}
                              download
                              className="btn btn-outline btn-sm no-underline"
                            >
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span>Spec Sheet</span>
                              <span className="text-[10px] text-slate-500 font-mono">.PDF</span>
                            </a>
                            <a
                              href={urls.ies}
                              download
                              className="btn btn-outline btn-sm no-underline"
                            >
                              <FileDown className="w-4 h-4 text-slate-400" />
                              <span>Photometric</span>
                              <span className="text-[10px] text-slate-500 font-mono">.IES</span>
                            </a>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
            <button
              onClick={() => onInquire('Custom Specification')}
              className="btn btn-primary group"
            >
              <span className="flex items-center gap-2">
                Request a Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
