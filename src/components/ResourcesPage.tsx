import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, FileDown, FileText, ShieldCheck, Download } from 'lucide-react';
import { PageHeroBackground } from './animations';
import { DATASHEET_LIBRARY, datasheetDownloadUrl } from '../products';
import { useSiteContent } from '../content';

export const ResourcesPage: React.FC = () => {
  const { resources } = useSiteContent();
  const datasheets = DATASHEET_LIBRARY;

  const downloads = [
    { label: 'Technical Datasheets', description: 'Product specifications, dimensions, and performance data — download every datasheet below.', icon: FileText, to: '/resources' },
    { label: 'IES Files', description: 'Photometric data files for lighting simulation software — create a free account and download instantly.', icon: FileDown, to: '/ies' },
    { label: 'Compliance Documentation', description: 'SABS, IEC, and OSHACT compliance certificates — available with quotations and projects.', icon: ShieldCheck, to: '/contact' },
    { label: 'Warranty Terms', description: 'Manufacturer-backed warranty documentation per product range, confirmed in quotation.', icon: FileText, to: '/contact' },
  ];

  return (
    <div className="pt-[104px]">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{resources.label}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              {resources.heading.lead}<span className="gradient-text">{resources.heading.accent}</span>{resources.heading.tail}
            </h1>
            <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
              {resources.subcopy}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {downloads.map((item, i) => {
              const Icon = item.icon;
              const isLibrary = item.to === '/resources';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                  className="gradient-border-card card-lift p-6 group flex items-start gap-5 text-left relative"
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
                  {isLibrary ? (
                    <button
                      type="button"
                      aria-label={item.label}
                      onClick={() => document.getElementById('datasheet-library')?.scrollIntoView({ behavior: 'smooth' })}
                      className="absolute inset-0 cursor-pointer"
                    />
                  ) : (
                    <Link to={item.to} aria-label={item.label} className="absolute inset-0" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Company profile download */}
          <a
            href="/downloads/LumenX-Company-Profile.pdf"
            download
            className="mt-6 gradient-border-card card-lift p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between no-underline"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/[0.05] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary/50" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white mb-1 tracking-tight">LumenX Company Profile</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">
                  Full company overview, capabilities and credentials — download the latest profile.
                </p>
              </div>
            </div>
            <span className="btn btn-primary btn-sm shrink-0 inline-flex">
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </span>
          </a>
        </div>
      </section>

      {/* Datasheet library — all product documentation in one spot */}
      <section id="datasheet-library" className="relative py-20 sm:py-24 overflow-hidden bg-[#06090F]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Datasheet Library</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em] mb-4">
              Every datasheet, <span className="gradient-text">one download hub</span>
            </h2>
            <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
              {datasheets.length} product datasheets covering the full LumenX range.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasheets.map((sheet, i) => (
              <motion.div
                key={sheet.href}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: (i % 9) * 0.05, duration: 0.5 }}
                className="border border-[#1E293B]/70 bg-[#0A0F17] hover:border-primary/30 transition-colors duration-300 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-primary/50 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate font-display">{sheet.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">PDF Datasheet</p>
                  </div>
                </div>
                <a
                  href={datasheetDownloadUrl(sheet.href)}
                  download
                  className="btn btn-outline btn-sm no-underline shrink-0"
                  aria-label={`Download ${sheet.name} datasheet`}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
