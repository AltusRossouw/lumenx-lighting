import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { HeroSection } from './HeroSection';
import { DifferenceCarousel } from './DifferenceCarousel';
import { CTASection } from './CTASection';
import { AccreditationBar } from './AccreditationBar';
import { LumenXMark } from './ui/lumenx-mark';
import { FEATURED_PROJECTS, PRODUCT_CATEGORIES } from '../data';
import { useSiteContent } from '../content';
import {
  ArrowRight,
  Building2,
  MapPin,
} from 'lucide-react';

/* ── Shared teaser shell: headline + short copy (body sits under the heading) ── */
interface TeaserProps {
  id?: string;
  label?: string;
  title: React.ReactNode;
  copy?: string;
  children?: React.ReactNode;
  /** Reduce bottom padding to pull the following section up. */
  tightBottom?: boolean;
}

const Teaser: React.FC<TeaserProps> = ({ id, label, title, copy, children, tightBottom }) => (
  <section id={id} className={`relative overflow-hidden bg-[#06090F] ${tightBottom ? 'pt-20 sm:pt-28 pb-8 sm:pb-12' : 'py-20 sm:py-28'}`}>
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
      >
        {label && (
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{label}</span>
          </div>
        )}
        <div className="mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em] max-w-2xl mb-4">{title}</h2>
          {copy && (
            <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed font-sans font-light">
              {copy}
            </p>
          )}
        </div>
      </motion.div>
      {children}
    </div>
  </section>
);

const TeaserLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 text-xs font-semibold text-primary/70 hover:text-primary transition-colors duration-300 cursor-pointer font-display mt-8"
    >
      {label}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
    </Link>
  );
};

/* ── 1 · The Solution teaser ── */
const SolutionTeaser: React.FC = () => {
  const { home, completeSolution } = useSiteContent();
  const t = home.solution;
  return (
    <Teaser
      id="solution"
      title={<>{t.title.lead}<span className="gradient-text">{t.title.accent}</span>{t.title.tail}</>}
      copy={t.copy}
      tightBottom
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {completeSolution.map((cap) => (
          <div
            key={cap.title}
            className="flex items-center gap-3 px-5 py-4 border border-[#1E293B]/70 bg-[#0A0F17] hover:border-primary/40 hover:bg-primary/[0.03] transition-colors duration-300"
          >
            <img
              src={cap.heroIcon}
              alt=""
              className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.35)] shrink-0"
            />
            <span className="font-display text-sm font-semibold text-slate-200">{cap.title}</span>
          </div>
        ))}
      </div>
      <TeaserLink to="/the-solution" label={t.link} />
    </Teaser>
  );
};

/* ── 2 · Featured Projects teaser ── */
const ProjectsTeaser: React.FC = () => {
  const { home } = useSiteContent();
  const t = home.projects;
  return (
    <Teaser
      id="projects"
      label={t.label}
      title={<>{t.title.lead}<span className="gradient-text">{t.title.accent}</span>{t.title.tail}</>}
      copy={t.copy}
    >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {FEATURED_PROJECTS.map((p) => (
        <div key={p.name} className="gradient-border-card card-lift overflow-hidden group">
          {p.imageUrl && (
            <div className="relative h-48 overflow-hidden bg-[#080D15]">
              <img
                src={p.imageUrl}
                alt={p.imageAlt || p.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06090F]/85 via-transparent to-transparent" />
              {p.category && (
                <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded-full bg-[#06090F]/80 backdrop-blur-sm border border-primary/30 text-[9px] font-mono text-primary uppercase tracking-[0.2em]">
                  {p.category}
                </span>
              )}
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-primary/[0.06] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary/50" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white tracking-tight">{p.name}</h3>
                <p className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3" /> {p.location}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{p.scope}</p>
          </div>
        </div>
      ))}
    </div>
    <TeaserLink to="/projects" label={t.link} />
  </Teaser>
  );
};

/* ── 5 · Product Categories teaser ── */
const CategoriesTeaser: React.FC = () => {
  const { home } = useSiteContent();
  const t = home.categories;
  return (
    <Teaser
      id="product-categories"
      label={t.label}
      title={<>{t.title.lead}<span className="gradient-text">{t.title.accent}</span>{t.title.tail}</>}
      copy={t.copy}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PRODUCT_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={`/products/${c.id}`}
            className="group relative overflow-hidden h-40 gradient-border-card card-lift text-left"
          >
            <img
              src={c.imageUrl}
              alt={c.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-[#06090F]/45 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="font-display text-sm font-semibold text-white group-hover:text-primary transition-colors duration-300">
                {c.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <TeaserLink to="/products" label={t.link} />
    </Teaser>
  );
};

/* ── 6 · Who It's For teaser ── */
const WhoItsForTeaser: React.FC = () => {
  const { home, industries } = useSiteContent();
  const t = home.who;
  return (
    <Teaser
      id="who-its-for"
      label={t.label}
      title={<>{t.title.lead}<span className="gradient-text">{t.title.accent}</span>{t.title.tail}</>}
      copy={t.copy}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {industries.map((sector, i) => (
          <React.Fragment key={sector.name}>
            {i > 0 && <LumenXMark className="w-2 h-2 text-primary/40" />}
            <span className="inline-flex items-center gap-2">
              <img
                src={sector.iconImg}
                alt=""
                className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]"
              />
              <span className="text-sm font-semibold text-slate-300 font-display">{sector.name}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
      <TeaserLink to="/about" label={t.link} />
    </Teaser>
  );
};

export const HomePage: React.FC = () => {
  return (
    <div>
      {/* Hero */}
      <HeroSection />

      {/* Single consolidated social-proof bar — directly under the hero */}
      <AccreditationBar />

      {/* The "LumenX difference" carousel */}
      <DifferenceCarousel />

      {/* Teaser reel — light on content, deep info lives in the dedicated tabs */}
      <SolutionTeaser />
      <CategoriesTeaser />
      <WhoItsForTeaser />

      {/* Technical proof — moved directly above the final CTA */}
      <ProjectsTeaser />

      <CTASection />
    </div>
  );
};

