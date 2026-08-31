export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  applications: string;
  imageUrl: string;
  linkLabel: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

/** Full, detailed product record for the catalogue. */
export interface Product {
  /** URL-safe unique slug (unique within its category). */
  slug: string;
  name: string;
  /** Category id this product belongs to. */
  category: string;
  /** Manufacturer / brand the product is sourced from. */
  supplier: string;
  /** Short one-line summary. */
  summary: string;
  /** Longer, detailed description. */
  description: string;
  /** Primary specification table. */
  specs: ProductSpec[];
  /** Key feature bullets. */
  features: string[];
  /** Typical applications. */
  applications: string[];
  /** Product image or illustrative category image. */
  imageUrl: string;
  /** Local datasheet download. */
  pdfUrl?: string;
  /** Local photometric (.ies) download. */
  iesUrl?: string;
  /** Warranty / guarantee statement. */
  warranty?: string;
}

export interface ProductDetail {
  name: string;
  description: string;
  specs: { label: string; value: string }[];
  applications: string[];
  imageUrl: string;
  pdfUrl?: string;
  iesUrl?: string;
}

export interface Industry {
  name: string;
  iconImg: string;
}

export interface ComplianceItem {
  label: string;
  description: string;
}

export interface WhyChooseReason {
  title: string;
  description: string;
  icon: string;
  iconImg: string;
}

export interface CompanyOverview {
  tagline: string;
  intro: string;
  coreSpecialisation: string;
  geographicReach: string;
  marketFocus: string;
  mission: string;
  vision: string;
  values: string;
  team: string;
}

export interface CompleteSolutionCapability {
  title: string;
  description: string;
  icon: string;
  heroIcon: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  iconImg: string;
}

export interface FeaturedProject {
  name: string;
  location: string;
  scope: string;
  delivered: string;
  imageUrl?: string;
  imageAlt?: string;
  category?: string;
}

export interface InstallationImage {
  src: string;
  alt: string;
  category: string;
  application: string;
}

export interface AudienceProfile {
  title: string;
  description: string;
  iconImg: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ManagingDirector {
  name: string;
  role: string;
  phone: string;
  email: string;
  headshot: string;
  signatureImage: string;
  signatureAlt: string;
}
