export interface NavSection {
  id: string;
  label: string;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}

export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  applications: string;
  imageUrl: string;
  linkLabel: string;
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
