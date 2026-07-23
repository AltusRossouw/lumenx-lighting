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
  imageUrl: string;
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
}

export interface ComplianceItem {
  label: string;
  description: string;
}

export interface WhyChooseReason {
  title: string;
  description: string;
  icon: string;
}

export interface CompanyOverview {
  tagline: string;
  intro: string;
  mission: string;
  vision: string;
  values: string;
  team: string;
  coreSpecialisation: string;
  geographicReach: string;
  marketFocus: string;
}
