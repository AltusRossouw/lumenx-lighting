// Editable site copy — the client half of the CMS layer.
//
//   SiteContent        — the shape that is edited/stored (text only).
//   DEFAULT_CONTENT    — the current hardcoded copy, seeded from data.ts + inline strings.
//   useSiteContent()   — React hook returning the RESOLVED copy (stored overrides
//                        merged back over data.ts so icons/images are preserved).
//
// The backend only ever stores the full document once someone saves in /admin.
// Until then, the site renders exactly the hardcoded DEFAULT_CONTENT.

import { useMemo, useSyncExternalStore } from 'react';
import {
  COMPANY,
  COMPLETE_SOLUTION,
  INDUSTRIES,
  COMPLIANCE_ITEMS,
  WHY_CHOOSE,
  PROCESS_STEPS,
  AUDIENCE_PROFILES,
  FAQS,
  CONTACT,
} from './data';
import type {
  CompanyOverview,
  CompleteSolutionCapability,
  Industry,
  ComplianceItem,
  WhyChooseReason,
  ProcessStep,
  AudienceProfile,
  FAQ,
} from './types';

/* ── Editable shapes (stored) ──────────────────────────────────────────── */

export interface Heading {
  lead: string;
  accent: string;
  tail: string;
}

export interface TextItem {
  title: string;
  description: string;
}

export interface LabelItem {
  label: string;
  description: string;
}

export interface QaItem {
  question: string;
  answer: string;
}

export interface Teaser {
  label?: string;
  title: Heading;
  copy: string;
  link: string;
}

export interface SiteContent {
  company: {
    tagline: string;
    intro: string;
    coreSpecialisation: string;
    geographicReach: string;
    marketFocus: string;
    mission: string;
    vision: string;
    values: string;
    team: string;
  };
  hero: {
    badge: string;
    headlineLead: string;
    headlineAccent: string;
    headlineTail: string;
    serviceTags: string[];
    primaryCta: string;
    secondaryCta: string;
    trustItems: string[];
  };
  solution: {
    headingTop: string;
    headingBottom: string;
    subcopy: string;
    items: TextItem[];
  };
  compliance: {
    label: string;
    heading: Heading;
    about: string;
    partnersHeading: string;
    partnersCopy: string;
    qaHeading: string;
    items: LabelItem[];
  };
  whyChoose: { subcopy: string; items: TextItem[] };
  process: { label: string; heading: Heading; subcopy: string; items: TextItem[] };
  audience: { label: string; heading: Heading; items: TextItem[] };
  industries: { items: string[] };
  faqs: { label: string; heading: Heading; items: QaItem[] };
  contact: {
    email: string;
    projectsEmail: string;
    phone: string;
    website: string;
    tagline: string;
    footerBlurb: string;
  };
  cta: { label: string; heading: Heading; subcopy: string; button: string };
  home: {
    solution: Teaser;
    projects: Teaser;
    technicalProof: Teaser & { bullets: string[] };
    process: Teaser;
    categories: Teaser;
    who: Teaser;
  };
  services: { heading: Heading; subcopy: string };
  products: { badge: string; heading: Heading; subcopy: string };
  resources: { label: string; heading: Heading; subcopy: string };
  projects: { label: string; heading: Heading; subcopy: string };
  seo: {
    homeTitle: string;
    homeDescription: string;
    solutionTitle: string;
    solutionDescription: string;
    productsTitle: string;
    productsDescription: string;
  };
  complianceBar: { text: string };
}

/* ── Defaults (current hardcoded copy) ─────────────────────────────────── */

export const DEFAULT_CONTENT: SiteContent = {
  company: { ...COMPANY },
  hero: {
    badge: 'South Africa — Nationwide',
    headlineLead: 'LIGHTING',
    headlineAccent: 'ENGINEERED',
    headlineTail: 'FOR REAL PROJECTS',
    serviceTags: ['Specification', 'Value Engineering', 'Supply', 'Project Coordination and Completion'],
    primaryCta: 'Submit your lighting requirement',
    secondaryCta: 'Explore Products',
    trustItems: ['Nationwide Coverage', 'B-BBEE Level 2', 'SABS / IEC / OSHACT Aligned'],
  },
  solution: {
    headingTop: 'One team manages the whole lighting project',
    headingBottom: 'from design through to delivery.',
    subcopy:
      'Design, specification, value engineering, supply and coordination — one accountable team, from first drawing to site.',
    items: COMPLETE_SOLUTION.map(({ title, description }) => ({ title, description })),
  },
  compliance: {
    label: 'Compliance & Technical Assurance',
    heading: { lead: 'Standards and ', accent: 'quality', tail: ' you can rely on' },
    about:
      'started with one idea: lighting projects need stronger technical ownership. We\'re not just a product source. We work as a project partner — tying together design intent, engineering, budget, compliance and site execution into one accountable solution.',
    partnersHeading: 'Brands & Manufacturing Partners',
    partnersCopy: 'works with manufacturing and supply partners chosen for performance, consistency and project fit.',
    qaHeading: 'Compliance & Quality Assurance',
    items: COMPLIANCE_ITEMS.map(({ label, description }) => ({ label, description })),
  },
  whyChoose: {
    subcopy:
      'Each point answers three questions: what we do differently, why it matters on site, and what risk it removes.',
    items: WHY_CHOOSE.map(({ title, description }) => ({ title, description })),
  },
  process: {
    label: 'How We Manage Your Lighting Project',
    heading: { lead: 'A clear process from ', accent: 'brief to delivery', tail: '' },
    subcopy: "A clear process means fewer surprises. Here's what working with us looks like.",
    items: PROCESS_STEPS.map(({ title, description }) => ({ title, description })),
  },
  audience: {
    label: 'Built for the Teams Delivering the Project',
    heading: { lead: 'Lighting across ', accent: 'demanding environments', tail: '' },
    items: AUDIENCE_PROFILES.map(({ title, description }) => ({ title, description })),
  },
  industries: { items: INDUSTRIES.map((i) => i.name) },
  faqs: {
    label: 'Frequently Asked Questions',
    heading: { lead: 'Common questions ', accent: 'answered', tail: '' },
    items: FAQS.map(({ question, answer }) => ({ question, answer })),
  },
  contact: {
    email: CONTACT.email,
    projectsEmail: CONTACT.projectsEmail,
    phone: CONTACT.phone,
    website: CONTACT.website,
    tagline: CONTACT.tagline,
    footerBlurb:
      'Technically driven lighting solutions serving retail, commercial, and industrial projects across South Africa.',
  },
  cta: {
    label: 'Next Step',
    heading: { lead: 'Bring LumenX into ', accent: 'the project', tail: '' },
    subcopy: "Send your drawings, BOQ, spec or brief — we'll review it and advise on the next step.",
    button: 'Submit your lighting requirement',
  },
  home: {
    solution: {
      title: { lead: 'One partner ', accent: 'the complete project', tail: '' },
      copy: 'Design, specification, supply and coordination — one team from first drawing to handover.',
      link: 'See how the complete solution works',
    },
    projects: {
      label: 'Featured Projects',
      title: { lead: 'Technical proof ', accent: 'not promises', tail: '' },
      copy: "Commercial and industrial lighting projects we've delivered, end to end.",
      link: 'View featured projects',
    },
    technicalProof: {
      label: 'Technical Proof',
      title: { lead: 'Documentation ', accent: 'standards and warranties', tail: '' },
      copy: 'Specs backed by data, simulations and compliance docs.',
      link: 'Download technical documentation',
      bullets: [
        'SABS / IEC / OSHACT aligned',
        'B-BBEE Level 2',
        'Manufacturer-backed warranties',
        'Lighting simulations & calculations',
      ],
    },
    process: {
      label: 'How It Works',
      title: { lead: 'A clear process ', accent: 'brief to delivery', tail: '' },
      copy: 'Six steps, brief to delivery.',
      link: 'Explore the full process',
    },
    categories: {
      label: 'Product Categories',
      title: { lead: 'Lighting selected around ', accent: 'the application', tail: '' },
      copy: 'Commercial, industrial, outdoor, emergency and smart lighting ranges.',
      link: 'Browse all products',
    },
    who: {
      label: "Who It's For",
      title: { lead: 'Built for the teams ', accent: 'delivering projects', tail: '' },
      copy: 'Engineers, contractors, architects, developers and procurement teams.',
      link: 'More about who we work with',
    },
  },
  services: {
    heading: { lead: 'One technical partner ', accent: 'the complete lighting project', tail: '' },
    subcopy:
      'Design, specification, value engineering, supply and coordination — one team, from first drawing to site.',
  },
  products: {
    badge: 'Product Portfolio',
    heading: { lead: 'Lighting ', accent: 'Solutions', tail: '' },
    subcopy:
      'A comprehensive range of fit-for-purpose luminaires and control solutions — from architectural interiors to heavy industrial environments. Every product selected for performance, compliance, and long-term value.',
  },
  resources: {
    label: 'Technical Resources',
    heading: { lead: 'Documentation and ', accent: 'downloads', tail: '' },
    subcopy:
      'Technical datasheets, IES files, compliance documentation, and warranty information for specifiers, engineers, and contractors.',
  },
  projects: {
    label: 'Featured Projects',
    heading: { lead: 'Technical proof ', accent: 'not promises', tail: '' },
    subcopy:
      'Every project is supported by lighting design, specification discipline, compliance documentation and coordinated delivery.',
  },
  seo: {
    homeTitle: 'LumenX Lighting — Engineered for Real Projects | Industrial & Commercial LED Solutions',
    homeDescription:
      'LumenX delivers intelligent LED lighting solutions for retail, commercial, and industrial projects across South Africa.',
    solutionTitle: 'The Solution — LumenX Lighting',
    solutionDescription: 'Design, specification, value engineering, supply and project coordination — one accountable team.',
    productsTitle: 'Products — LumenX Lighting',
    productsDescription:
      'Explore the LumenX LED lighting catalogue — bulkheads, downlights, floodlights, highbays, linears, panels and more.',
  },
  complianceBar: { text: 'SANS 10114 & SABS Sourcing Compliance Certified' },
};

/* ── Resolved shape (what components consume) ──────────────────────────── */

export interface ResolvedContent {
  company: CompanyOverview;
  hero: SiteContent['hero'];
  solution: { headingTop: string; headingBottom: string; subcopy: string };
  completeSolution: CompleteSolutionCapability[];
  compliance: {
    label: string;
    heading: Heading;
    about: string;
    partnersHeading: string;
    partnersCopy: string;
    qaHeading: string;
  };
  complianceItems: ComplianceItem[];
  whyChooseSubcopy: string;
  whyChoose: WhyChooseReason[];
  process: { label: string; heading: Heading; subcopy: string };
  processSteps: ProcessStep[];
  audience: { label: string; heading: Heading };
  audienceProfiles: AudienceProfile[];
  industries: Industry[];
  faqs: { label: string; heading: Heading };
  faqItems: FAQ[];
  contact: SiteContent['contact'];
  cta: SiteContent['cta'];
  home: SiteContent['home'];
  services: SiteContent['services'];
  products: SiteContent['products'];
  resources: SiteContent['resources'];
  projects: SiteContent['projects'];
  seo: SiteContent['seo'];
  complianceBar: SiteContent['complianceBar'];
}

/** Recursively merge a stored (possibly partial) document over DEFAULT_CONTENT. */
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const deepMerge = <T,>(base: T, override: unknown): T => {
  if (Array.isArray(base) && Array.isArray(override)) return override as T;
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = deepMerge((base as Record<string, unknown>)[k], override[k]);
    }
    return out as T;
  }
  return (override === undefined ? base : override) as T;
};

/** Merge a stored (possibly partial) document over DEFAULT_CONTENT. */
export const mergeSiteContent = (stored: unknown): SiteContent =>
  deepMerge(DEFAULT_CONTENT, stored);

/** Zip icon-bearing defaults with editable text overrides, preserving icons. */
const zip = <T extends { icon?: string; iconImg?: string; number?: string }>(
  defaults: T[],
  overrides: { title: string; description: string }[] | undefined,
): T[] =>
  defaults.map((d, i) => {
    const o = overrides?.[i];
    if (!o) return d;
    return { ...d, title: o.title, description: o.description };
  });

const resolve = (content: SiteContent): ResolvedContent => ({
  company: { ...COMPANY, ...content.company },
  hero: content.hero,
  solution: {
    headingTop: content.solution.headingTop,
    headingBottom: content.solution.headingBottom,
    subcopy: content.solution.subcopy,
  },
  completeSolution: zip(COMPLETE_SOLUTION, content.solution.items),
  compliance: {
    label: content.compliance.label,
    heading: content.compliance.heading,
    about: content.compliance.about,
    partnersHeading: content.compliance.partnersHeading,
    partnersCopy: content.compliance.partnersCopy,
    qaHeading: content.compliance.qaHeading,
  },
  complianceItems: content.compliance.items.map((o, i) => ({
    label: o.label,
    description: o.description ?? COMPLIANCE_ITEMS[i]?.description ?? '',
  })),
  whyChooseSubcopy: content.whyChoose.subcopy,
  whyChoose: zip(WHY_CHOOSE, content.whyChoose.items),
  process: {
    label: content.process.label,
    heading: content.process.heading,
    subcopy: content.process.subcopy,
  },
  processSteps: zip(PROCESS_STEPS, content.process.items),
  audience: { label: content.audience.label, heading: content.audience.heading },
  audienceProfiles: zip(AUDIENCE_PROFILES, content.audience.items),
  industries: INDUSTRIES.map((ind, i) => ({
    ...ind,
    name: content.industries.items[i] ?? ind.name,
  })),
  faqs: { label: content.faqs.label, heading: content.faqs.heading },
  faqItems: content.faqs.items.map((o, i) => ({
    question: o.question ?? FAQS[i]?.question ?? '',
    answer: o.answer ?? FAQS[i]?.answer ?? '',
  })),
  contact: content.contact,
  cta: content.cta,
  home: content.home,
  services: content.services,
  products: content.products,
  resources: content.resources,
  projects: content.projects,
  seo: content.seo,
  complianceBar: content.complianceBar,
});

/* ── Reactive store ────────────────────────────────────────────────────── */

let content: SiteContent = DEFAULT_CONTENT;
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => content;

/** Set the resolved content in one place (used on load and after admin save). */
export const setSiteContent = (next: SiteContent) => {
  content = mergeSiteContent(next);
  listeners.forEach((cb) => cb());
};

export const getSiteContent = (): SiteContent => content;

/** Fetch the published content once at startup; falls back to defaults silently. */
export const loadSiteContent = async () => {
  try {
    const res = await fetch('/api/content', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.content) setSiteContent(data.content as SiteContent);
  } catch {
    // Keep defaults — the site must render even if the backend is down.
  }
};

/** Reactive hook — returns resolved copy with icons/images merged back in. */
export const useSiteContent = (): ResolvedContent => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(() => resolve(snapshot), [snapshot]);
};
