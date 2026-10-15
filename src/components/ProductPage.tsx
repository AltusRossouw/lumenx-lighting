import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getCategory, getProduct, getProductsByCategory, getProductImages, datasheetDownloadUrl, iesVariantLabel, displayName } from '../products';
import { iesFilesForProduct } from '../ies-product-map';
import { api } from '../lib/api';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileDown,
  FileText,
  Mail,
  ShieldCheck,
  Layers,
  Lock,
  Target,
} from 'lucide-react';
import { PageHeroBackground } from './animations';
import { ProductImageGallery } from './ProductImageGallery';

interface ProductPageProps {
  categoryId: string;
  slug: string;
}

export const ProductPage: React.FC<ProductPageProps> = ({ categoryId, slug }) => {
  const [iesAuthed, setIesAuthed] = useState(false);
  const [iesVisible, setIesVisible] = useState(10);

  useEffect(() => {
    let active = true;
    api
      .me()
      .then(({ user }) => {
        if (active) setIesAuthed(Boolean(user));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Reset the "show more" window when moving between products.
  useEffect(() => {
    setIesVisible(10);
  }, [slug]);

  const category = getCategory(categoryId);
  const product = getProduct(categoryId, slug);
  const iesFiles = iesFilesForProduct(slug);

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
  // OrbitX fittings render with their brand prefix on every surface — heading,
  // breadcrumb, gallery alt text and prev/next — while the slug stays put.
  const name = displayName(product);
  const index = siblings.findIndex((p) => p.slug === slug);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  // Ordered gallery (hero first) drives the carousel.
  const galleryImages = getProductImages(product);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-[104px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
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
            <span className="text-white">{name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Copy */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full bg-white/[0.03] border border-white/10 text-slate-400">
                  {category.title}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 tracking-[-0.02em]">
                {name}
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
                    Submit your lighting requirement
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </motion.div>

            {/* Image gallery / carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <ProductImageGallery
                images={galleryImages}
                name={name}
              />
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
                {product.specs.length > 0 ? (
                  product.specs.map((spec, i) => (
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
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-slate-400 font-sans font-light">
                      Full technical data for the {name} is available on request.
                    </p>
                    <Link
                      to="/contact"
                      className="mt-4 inline-flex text-sm text-primary hover:underline font-sans"
                    >
                      Contact our technical team →
                    </Link>
                  </div>
                )}
              </div>

              {/*
                Downloads — the datasheet PDF is open, photometry stays gated
                (client decision Q10: do not open the downloads up).

                This block deliberately has no outer guard. It used to be
                wrapped in `{(product.pdfUrl || iesFiles.length > 0) && …}`,
                which hid the whole thing — including the "contact us" route
                below — on exactly the products that have no photometry yet.
                That is backwards: those are the products where a specifier
                needs to be told how to get the file.
              */}
              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-3">
                  {product.pdfUrl && (
                    <a href={datasheetDownloadUrl(product.pdfUrl)} download className="btn btn-outline btn-sm no-underline">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Spec Sheet</span>
                      <span className="text-[10px] text-slate-500 font-mono">.PDF</span>
                    </a>
                  )}
                  {iesFiles.length > 0 && !iesAuthed && (
                    <Link
                      to="/account"
                      state={{ from: `/products/${categoryId}/${slug}` }}
                      className="btn btn-outline btn-sm no-underline"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Login or register to download .IES</span>
                    </Link>
                  )}
                  {iesFiles.length === 0 && (
                    <Link to="/contact" className="btn btn-outline btn-sm no-underline">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>Contact us for the IES file</span>
                    </Link>
                  )}
                </div>

                  {iesFiles.length > 0 && iesAuthed && (
                    <div className="mt-4 border border-[#1E293B]/70 bg-[#0A0F17] p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <FileDown className="w-4 h-4 text-primary/60" />
                        <h3 className="font-display text-sm font-semibold text-white tracking-tight">
                          Photometric files
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          {iesFiles.length} .IES
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">
                        Raw LM-63 photometry for this product, for use in lighting-design software.
                      </p>
                      <ul className="divide-y divide-[#1E293B]/60">
                        {iesFiles.slice(0, iesVisible).map((filename) => (
                          <li key={filename} className="flex items-center justify-between gap-4 py-2">
                            <span className="min-w-0 text-sm text-slate-300 truncate" title={filename}>
                              {iesVariantLabel(filename)}
                            </span>
                            <a
                              href={`/api/ies/${encodeURIComponent(filename)}`}
                              download
                              className="text-xs text-primary hover:underline font-mono shrink-0"
                            >
                              .IES ↓
                            </a>
                          </li>
                        ))}
                      </ul>
                      {iesFiles.length > iesVisible && (
                        <button
                          type="button"
                          onClick={() => setIesVisible((n) => n + 25)}
                          className="mt-3 text-xs text-primary hover:underline font-mono"
                        >
                          Show {Math.min(25, iesFiles.length - iesVisible)} more of {iesFiles.length} →
                        </button>
                      )}
                    </div>
                  )}
                </div>
            </div>

            {/* Sidebar: features + applications */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold text-white tracking-tight">Key Features</h3>
                </div>
                <ul className="list-disc pl-5 space-y-3 marker:text-primary">
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
                  <p className="text-sm font-semibold text-white truncate font-display">{displayName(prev)}</p>
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
                  <p className="text-sm font-semibold text-white truncate font-display">{displayName(next)}</p>
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
              Our technical team can confirm availability, lead times and project pricing for the {name}.
            </p>
            <Link to="/contact" className="btn btn-primary group inline-flex no-underline">
              <span className="flex items-center gap-2">
                Submit your lighting requirement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
