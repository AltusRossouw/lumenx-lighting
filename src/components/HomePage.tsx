import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { HeroSection } from './HeroSection';
import { CTASection } from './CTASection';
import { AccreditationBar } from './AccreditationBar';
import { LumenXMark } from './ui/lumenx-mark';
import {
  COMPLETE_SOLUTION,
  FEATURED_PROJECTS,
  PROCESS_STEPS,
  PRODUCT_CATEGORIES,
  AUDIENCE_PROFILES,
  INDUSTRIES,
  WHY_CHOOSE,
} from '../data';
import {
  ArrowRight,
  Building2,
  MapPin,
  CheckCircle,
} from 'lucide-react';

/* ── Shared teaser shell: label + headline + short copy ── */
interface TeaserProps {
  id?: string;
  label: string;
  title: React.ReactNode;
  copy?: string;
  children?: React.ReactNode;
}

const Teaser: React.FC<TeaserProps> = ({ id, label, title, copy, children }) => (
  <section id={id} className="relative py-20 sm:py-28 overflow-hidden bg-[#06090F]">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-primary/40" />
          <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">{label}</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em] max-w-2xl">{title}</h2>
          {copy && (
            <p className="text-slate-400 max-w-md text-sm sm:text-base leading-relaxed font-sans font-light lg:text-right">
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
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="group inline-flex items-center gap-2 text-xs font-semibold text-primary/70 hover:text-primary transition-colors duration-300 cursor-pointer font-display mt-8"
    >
      {label}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
    </button>
  );
};

/* ── 1 · The Solution teaser ── */
const SolutionTeaser: React.FC = () => (
  <Teaser
    id="solution"
    label="The Solution"
    title={<>One partner, <span className="gradient-text">the complete project</span></>}
    copy="Design, specification, value engineering, supply and coordination — held by one accountable technical team."
  >
    <div className="flex flex-wrap gap-3">
      {COMPLETE_SOLUTION.map((cap) => (
        <span
          key={cap.title}
          className="inline-flex items-center gap-3 px-5 py-3 border border-[#1E293B]/70 bg-[#0A0F17] hover:border-primary/40 hover:bg-primary/[0.03] transition-colors duration-300"
        >
          <img
            src={cap.heroIcon}
            alt=""
            className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.35)]"
          />
          <span className="font-display text-sm font-semibold text-slate-200">{cap.title}</span>
        </span>
      ))}
    </div>
    <TeaserLink to="/the-solution" label="See how the complete solution works" />
  </Teaser>
);

/* ── 2 · Featured Projects teaser ── */
const ProjectsTeaser: React.FC = () => (
  <Teaser
    id="projects"
    label="Featured Projects"
    title={<>Technical proof, <span className="gradient-text">not promises</span></>}
    copy="A snapshot of commercial and industrial lighting projects delivered end to end."
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
    <TeaserLink to="/projects" label="View featured projects" />
  </Teaser>
);

/* ── 3 · Technical Proof teaser ── */
const TechnicalProofTeaser: React.FC = () => (
  <Teaser
    id="technical-proof"
    label="Technical Proof"
    title={<>Documentation, <span className="gradient-text">standards and warranties</span></>}
    copy="Every specification is backed by the technical evidence project teams need."
  >
    <div className="border border-[#1E293B] bg-[#0A0F17] p-6 flex flex-wrap items-center gap-x-8 gap-y-3">
      {[
        'SABS / IEC / OSHACT aligned',
        'B-BBEE Level 2',
        'Manufacturer-backed warranties',
        'Lighting simulations & calculations',
      ].map((item) => (
        <span key={item} className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-[0.15em]">{item}</span>
        </span>
      ))}
    </div>
    <TeaserLink to="/resources" label="Download technical documentation" />
  </Teaser>
);

/* ── 4 · How It Works teaser ── */
const ProcessTeaser: React.FC = () => (
  <Teaser
    id="how-it-works"
    label="How It Works"
    title={<>A clear process, <span className="gradient-text">brief to delivery</span></>}
    copy="Six steps that reduce risk and keep the lighting package aligned."
  >
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
      {PROCESS_STEPS.map((step) => (
        <div key={step.number}>
          <span className="font-display text-5xl sm:text-6xl font-extrabold gradient-text leading-none">
            {step.number}
          </span>
          <img
            src={step.iconImg}
            alt=""
            className="w-8 h-8 object-contain mt-3 drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]"
          />
          <h3 className="font-display text-sm font-bold text-white mt-2 tracking-tight">{step.title}</h3>
        </div>
      ))}
    </div>
    <TeaserLink to="/the-solution" label="Explore the full process" />
  </Teaser>
);

/* ── 5 · Product Categories teaser ── */
const CategoriesTeaser: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Teaser
      id="product-categories"
      label="Product Categories"
      title={<>Lighting selected around <span className="gradient-text">the application</span></>}
      copy="Commercial, industrial, outdoor, emergency and smart lighting ranges."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PRODUCT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/products/${c.id}`)}
            className="group relative overflow-hidden h-40 gradient-border-card card-lift cursor-pointer text-left"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
              style={{ backgroundImage: `url(${c.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-[#06090F]/45 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="font-display text-sm font-semibold text-white group-hover:text-primary transition-colors duration-300">
                {c.title}
              </span>
            </div>
          </button>
        ))}
      </div>
      <TeaserLink to="/products" label="Browse all products" />
    </Teaser>
  );
};

/* ── 6 · Who It's For teaser ── */
const WhoItsForTeaser: React.FC = () => (
  <Teaser
    id="who-its-for"
    label="Who It's For"
    title={<>Built for the teams <span className="gradient-text">delivering projects</span></>}
    copy="Engineers, contractors, architects, developers and procurement teams."
  >
    <div className="flex flex-wrap gap-3 mb-10">
      {AUDIENCE_PROFILES.map((a) => (
        <span
          key={a.title}
          className="inline-flex items-center gap-3 px-5 py-3 border border-[#1E293B]/70 bg-[#0A0F17]"
        >
          <img
            src={a.iconImg}
            alt=""
            className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,212,255,0.35)]"
          />
          <span className="font-display text-sm font-bold text-white">{a.title}</span>
        </span>
      ))}
    </div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      {INDUSTRIES.map((sector, i) => (
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
    <TeaserLink to="/about" label="More about who we work with" />
  </Teaser>
);

/* ── 7 · Why LumenX teaser ── */
const WhyTeaser: React.FC = () => (
  <Teaser
    id="why-lumenx"
    label="Why LumenX"
    title={<>The <span className="gradient-text">LumenX</span> difference</>}
    copy="What LumenX does differently — and what that removes from your plate."
  >
    <div className="flex flex-wrap gap-3">
      {WHY_CHOOSE.map((reason) => (
        <span
          key={reason.title}
          className="inline-flex items-center gap-3 pl-4 pr-5 py-3 border border-[#1E293B]/70 bg-[#0A0F17]"
        >
          <img
            src={reason.iconImg}
            alt=""
            className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,212,255,0.35)]"
          />
          <span className="font-display text-sm font-bold text-white">{reason.title}</span>
        </span>
      ))}
    </div>
    <TeaserLink to="/about" label="The full LumenX difference" />
  </Teaser>
);

export const HomePage: React.FC = () => {
  return (
    <div>
      {/* Hero */}
      <HeroSection />

      {/* A/B Variant 1 — accreditation bar: items turn brand blue on hover */}
      <AccreditationBar variant="hover" />

      {/* Teaser reel — light on content, deep info lives in the dedicated tabs */}
      <SolutionTeaser />
      <ProjectsTeaser />
      <TechnicalProofTeaser />
      <ProcessTeaser />
      <CategoriesTeaser />
      <WhoItsForTeaser />
      <WhyTeaser />

      {/* A/B Variant 2 — accreditation bar: solid white strip with bold black text */}
      <AccreditationBar variant="strip" />

      <CTASection />
    </div>
  );
};

