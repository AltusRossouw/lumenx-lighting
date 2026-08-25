import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getCategory, getProduct, getProductsByCategory, datasheetDownloadUrl } from '../products';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  FileDown,
  FileText,
  ShieldCheck,
  Factory,
  Layers,
  Target,
} from 'lucide-react';
import { PageHeroBackground } from './animations';

interface ProductPageProps {
  categoryId: string;
  slug: string;
}

export const ProductPage: React.FC<ProductPageProps> = ({ categoryId, slug }) => {
  const category = getCategory(categoryId);
  const product = getProduct(categoryId, slug);

  if (!category || !product) {
    return (
      <div className="py-40 text-center text-slate-400">
        <p className="font-display text-xl font-semibold text-white mb-2">Product not found</p>
        <Link to="/products" className="text-primary hover:underline text-sm">
          Back to all products
        </Link>
      </div>
    );
  }

  const siblings = getProductsByCategory(categoryId);
  const index = siblings.findIndex((p) => p.slug === slug);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  // White-background product renders should never be cropped — show them fully.
  const isRender = product.imageUrl.startsWith('/product-images/');

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-[88px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-8 font-sans" aria-label="Breadcrumb">
            <Link to="/products" className="hover:text-white transition-colors">Products</Link>
            <span className="text-slate-700">/</span>
            <Link to={`/products/${category.id}`} className="hover:text-white transition-colors">
              {category.title}
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-white">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Copy */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Factory className="w-3 h-3" />
                  {product.supplier}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full bg-white/[0.03] border border-white/10 text-slate-400">
                  {category.title}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 tracking-[-0.02em]">
                {product.name}
              </h1>
              <p className="text-lg text-primary/90 font-sans font-light mb-4">{product.summary}</p>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-sans font-light max-w-xl">
                {product.description}
              </p>

              {product.warranty && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/[0.06] border border-primary/15 text-primary text-sm font-sans">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {product.warranty}
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/contact" className="btn btn-primary no-underline group">
                  <span className="flex items-center gap-2">
                    Enquire about {product.name}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                {product.supplierUrl && (
                  <a
                    href={product.supplierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline no-underline"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>View at {product.supplier}</span>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className={`relative overflow-hidden rounded-2xl gradient-border-card card-lift ${isRender ? 'bg-white' : ''}`}
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`w-full h-72 sm:h-96 ${isRender ? 'object-contain p-5' : 'object-cover'}`}
              />
              {!isRender && (
                <div className="absolute inset-0 bg-gradient-to-t from-[#06090F]/70 via-transparent to-transparent pointer-events-none" />
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full border backdrop-blur ${
                    isRender
                      ? 'bg-white/90 border-black/10 text-slate-700'
                      : 'bg-[#06090F]/80 border-white/10 text-slate-300'
                  }`}
                >
                  {product.supplier} · {category.title}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Specifications + details */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spec table */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-primary/40" />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
                  Technical <span className="gradient-text">Specifications</span>
                </h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                {product.specs.map((spec, i) => (
                  <div
                    key={spec.label}
                    className={`grid grid-cols-2 sm:grid-cols-[240px_1fr] ${
                      i !== 0 ? 'border-t border-[#1E293B]/60' : ''
                    }`}
                  >
                    <div className="px-4 sm:px-6 py-3.5 bg-white/[0.02]">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                        {spec.label}
                      </span>
                    </div>
                    <div className="px-4 sm:px-6 py-3.5">
                      <span className="text-sm text-white font-medium">{spec.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Downloads */}
              {(product.pdfUrl || product.iesUrl) && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {product.pdfUrl && (
                    <a href={datasheetDownloadUrl(product.pdfUrl)} download className="btn btn-outline btn-sm no-underline">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Spec Sheet</span>
                      <span className="text-[10px] text-slate-500 font-mono">.PDF</span>
                    </a>
                  )}
                  {product.iesUrl && (
                    <a href={product.iesUrl} download className="btn btn-outline btn-sm no-underline">
                      <FileDown className="w-4 h-4 text-slate-400" />
                      <span>Photometric</span>
                      <span className="text-[10px] text-slate-500 font-mono">.IES</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar: features + applications */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold text-white tracking-tight">Key Features</h3>
                </div>
                <ul className="list-x space-y-3">
                  {product.features.map((f) => (
                    <li key={f} className="text-sm text-slate-300 leading-relaxed font-sans font-light">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold text-white tracking-tight">Applications</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.applications.map((app) => (
                    <span
                      key={app}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10 text-[11px] text-primary font-mono"
                    >
                      <Check className="w-3 h-3" />
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prev / Next */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prev ? (
              <Link
                to={`/products/${category.id}/${prev.slug}`}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-[#1E293B] bg-[#0A0D14] hover:border-primary/20 transition-colors no-underline"
              >
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary group-hover:-translate-x-1 transition-all shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Previous</p>
                  <p className="text-sm font-semibold text-white truncate font-display">{prev.name}</p>
                </div>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to={`/products/${category.id}/${next.slug}`}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-[#1E293B] bg-[#0A0D14] hover:border-primary/20 transition-colors no-underline sm:justify-end text-right"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Next</p>
                  <p className="text-sm font-semibold text-white truncate font-display">{next.name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ) : (
              <span />
            )}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center p-10 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B]">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 tracking-[-0.02em]">
              Need a specification or quote?
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto font-sans font-light">
              Our technical team can confirm availability, lead times and project pricing for the {product.name}.
            </p>
            <Link to="/contact" className="btn btn-primary group inline-flex no-underline">
              <span className="flex items-center gap-2">
                Request a Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
