export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  applications: string;
  imageUrl: string;
  linkLabel: string;
  /** Which range selector the category appears under. */
  range?: 'lighting' | 'sensors';
  /** Position for admin-created categories (base categories keep their order). */
  sortOrder?: number;
  /** Present when this row comes from the admin catalogue overlay. */
  source?: 'db';
}

export interface ProductSpec {
  label: string;
  value: string;
}

/** A single gallery image for a product, with fit hints for the carousel. */
export interface ProductImage {
  src: string;
  alt?: string;
  /** 'contain' = product render on white/transparent (show fully);
   *  'cover' = application/lifestyle photo (fill the frame). */
  fit?: 'contain' | 'cover';
  /** Natural pixel dimensions — used to size the stage so nothing is cropped. */
  width?: number;
  height?: number;
}

/** Full, detailed product record for the catalogue. */
export interface Product {
  /** URL-safe unique slug (unique within its category). */
  slug: string;
  name: string;
  /** Category id this product belongs to. */
  category: string;
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
  /** Full ordered gallery of product images (hero first). Falls back to [imageUrl]. */
  images?: ProductImage[];
  /** Explicit main image. When set, it is shown first and used on cards. */
  mainImage?: string;
  /** Local datasheet download. */
  pdfUrl?: string;
  /** Original file name of an uploaded spec sheet. */
  pdfName?: string;
  /** How the spec sheet is produced: none, an uploaded PDF, or generated. */
  pdfSource?: 'none' | 'uploaded' | 'generated';
  /** Public visibility; false keeps the product in the admin but off the site. */
  published?: boolean;
  /** Warranty / guarantee statement. */
  warranty?: string;
  /** Manufacturer name captured from the source spec sheet. */
  manufacturer?: string;
  /** Manufacturer's own model code. */
  manufacturerModel?: string;
  /** Present when this row comes from the admin catalogue overlay. */
  source?: 'db';
  /**
   * Manufacturer brand id, when the fitting is not LumenX's own.
   *
   * OrbitX and LumenX have a partnership, so OrbitX fittings are published
   * under the OrbitX name and sort ahead of the rest of their category. The
   * slug never changes — only the display name does (see `displayName`).
   */
  brand?: string;
}

export interface ProductDetail {
  name: string;
  description: string;
  specs: { label: string; value: string }[];
  applications: string[];
  imageUrl: string;
  pdfUrl?: string;
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
}

/* ── About page ─────────────────────────────────────────────────────────── */

/** A single body paragraph in a team member's biography. */
export interface TeamBlock {
  body: string;
}

export interface TeamMember {
  name: string;
  role: string;
  /** Portrait asset path — fixed image, its copy only is editable in /admin. */
  image: string;
  imageAlt: string;
  /** One line on where this member's strength sits on a project. */
  focus: string;
  /** Biography, one paragraph per block so paragraph breaks survive editing. */
  blocks: TeamBlock[];
}

export interface AboutPageContent {
  hero: {
    eyebrow: string;
    heading: { lead: string; accent: string; tail: string };
    subcopy: string;
  };
  team: {
    label: string;
    heading: string;
    lede: string;
    /** Credential strip beneath the introduction. */
    highlights: { value: string; label: string }[];
    /**
     * The founders, each with their own headshot.
     *
     * There is deliberately no group photograph: the client could not find one
     * to use, and agreed on the 15 Oct call to show a headshot per founder
     * instead ("I'll just add a nice headshot of each of you").
     */
    members: TeamMember[];
  };
  closing: {
    heading: { lead: string; accent: string; tail: string };
    subcopy: string;
    cta: string;
  };
}
