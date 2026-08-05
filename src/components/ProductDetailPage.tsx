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
      <div className="py-40 text-center text-[#78716C]">Category not found.</div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Hero */}
      <section className="relative py-16 sm:py-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[#78716C] hover:text-[#FFFFFF] transition-colors mb-8 cursor-pointer group"
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
            <h1 className="font-serif font-semibold text-3xl sm:text-4xl font-normal text-[#FFFFFF] mb-4 tracking-[-0.02em]">
              {category.title}
            </h1>
            <p className="text-[#78716C] max-w-2xl text-sm sm:text-base leading-relaxed">
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
                        <h3 className="font-serif font-semibold text-xl font-semibold text-[#FFFFFF] mb-2 tracking-tight">{product.name}</h3>
                        <p className="text-sm text-[#78716C] leading-relaxed max-w-xl">{product.description}</p>
                      </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {product.specs.map((spec, j) => (
                        <div key={j} className="p-3 rounded-lg bg-[#0A0D14] border border-[#1E293B]">
                          <p className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-1">{spec.label}</p>
                          <p className="text-xs text-[#FFFFFF] font-medium">{spec.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Applications */}
                    <div className="mb-6">
                      <h4 className="text-xs font-mono text-[#64748B] uppercase tracking-wider mb-2">Applications</h4>
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

                    {/* CTA */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => onInquire(product.name)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-[#FFFFFF] font-semibold rounded-lg text-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer group/btn"
                      >
                        Enquire about {product.name}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>

                      {(() => {
                        const urls = getDownloadUrls(product);
                        return (
                          <>
                            <a
                              href={urls.pdf}
                              download
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#1E293B] hover:border-primary/30 text-[#FFFFFF] hover:text-[#FFFFFF] font-medium rounded-lg text-sm transition-all duration-200 cursor-pointer bg-[#0A0D14] hover:bg-[#111820] no-underline"
                            >
                              <FileText className="w-4 h-4 text-[#78716C]" />
                              <span>Spec Sheet</span>
                              <span className="text-[10px] text-[#64748B] font-mono">.PDF</span>
                            </a>
                            <a
                              href={urls.ies}
                              download
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#1E293B] hover:border-primary/30 text-[#FFFFFF] hover:text-[#FFFFFF] font-medium rounded-lg text-sm transition-all duration-200 cursor-pointer bg-[#0A0D14] hover:bg-[#111820] no-underline"
                            >
                              <FileDown className="w-4 h-4 text-[#78716C]" />
                              <span>Photometric</span>
                              <span className="text-[10px] text-[#64748B] font-mono">.IES</span>
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
            <h2 className="font-serif font-semibold text-xl sm:text-2xl font-normal text-[#FFFFFF] mb-3 tracking-[-0.02em]">
              Need a tailored solution?
            </h2>
            <p className="text-[#78716C] text-sm mb-6 max-w-lg mx-auto">
              Our technical team can help specify the right products for your project. Get a competitive quote with lead times and compliance documentation.
            </p>
            <button
              onClick={() => onInquire('Custom Specification')}
              className="group relative overflow-hidden px-8 py-3.5 bg-gradient-to-r from-primary to-[#00A8D5] text-[#FFFFFF] font-normal rounded-lg text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Request a Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-[#0A0D14]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
