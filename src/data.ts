import {
  Industry,
  ComplianceItem,
  WhyChooseReason,
  CompanyOverview,
  CompleteSolutionCapability,
  ProcessStep,
  FeaturedProject,
  AudienceProfile,
  FAQ,
  InstallationImage,
  ManagingDirector,
} from './types';

export const LOGO_URL = '/logo-wide.png';

export const COMPANY: CompanyOverview = {
  tagline: 'LIGHTING ENGINEERED FOR REAL PROJECTS',
  intro:
    'From design and specification to supply and site delivery, LumenX brings the technical and commercial sides of project lighting together through one accountable team.',
  coreSpecialisation:
    'Lighting design, specification, supply and coordination for commercial, retail and industrial projects.',
  geographicReach: 'South Africa — nationwide project support.',
  marketFocus: 'Retail, commercial and industrial lighting projects.',
  mission:
    'Own lighting technically from spec to site, so projects perform and stay compliant.',
  vision:
    'Be the lighting partner South African construction trusts to get it right — technically, commercially, on site.',
  values:
    'Technical integrity. Commercial practicality. Project accountability. Support after handover.',
  team:
    'One technical and commercial team that takes the lighting package from first drawing review to site handover.',
};

export const COMPLETE_SOLUTION: CompleteSolutionCapability[] = [
  {
    title: 'Design',
    icon: '/icons/solution-design.svg',
    heroIcon: '/icons/hero-design.svg',
    description:
      'Lighting layouts, calculations and simulations shaped around the project requirements.',
  },
  {
    title: 'Specification',
    icon: '/icons/solution-specification.svg',
    heroIcon: '/icons/hero-specification.svg',
    description:
      'Products chosen for performance, application and compliance.',
  },
  {
    title: 'Value Engineering',
    icon: '/icons/solution-value-engineering.svg',
    heroIcon: '/icons/hero-value-engineering.svg',
    description:
      'Cost-effective alternatives that still meet the spec.',
  },
  {
    title: 'Supply',
    icon: '/icons/solution-supply.svg',
    heroIcon: '/icons/hero-supply.svg',
    description:
      'Sourcing, availability and delivery, timed to the programme.',
  },
  {
    title: 'Project Coordination',
    icon: '/icons/solution-project-coordination.svg',
    heroIcon: '/icons/hero-project-coordination.svg',
    description:
      'Technical support across the project team, from design through to completion.',
  },
  {
    title: 'After-Sales Support',
    icon: '/icons/why-support.svg',
    heroIcon: '/icons/why-support.svg',
    description:
      'Commissioning, snags, replacements and warranty support after the products reach site.',
  },
];

// Product catalogue is defined in ./products.ts and re-exported here
// for backward-compatible imports across the app.
export { PRODUCT_CATEGORIES, PRODUCTS_BY_CATEGORY } from './products';

export const INDUSTRIES: Industry[] = [
  { name: 'Commercial developments', iconImg: '/icons/sector-commercial.svg' },
  { name: 'Education', iconImg: '/icons/sector-education.svg' },
  { name: 'Retail centres', iconImg: '/icons/sector-retail.svg' },
  { name: 'Industrial facilities', iconImg: '/icons/sector-industrial.svg' },
  { name: 'Hospitality', iconImg: '/icons/sector-hospitality.svg' },
  { name: 'Government and infrastructure', iconImg: '/icons/sector-government.svg' },
  { name: 'Healthcare', iconImg: '/icons/sector-healthcare.svg' },
  { name: 'Explosive Environments', iconImg: '/icons/sector-explosive.svg' },
];

export const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    label: 'Standards alignment',
    description:
      'Products selected and supplied against SABS, IEC and OSHACT requirements.',
  },
  {
    label: 'Energy performance',
    description:
      'Efficient LED and control-based solutions that hit project energy targets.',
  },
  {
    label: 'Warranty support',
    description:
      'Manufacturer-backed warranty terms, stated clearly per product range and project.',
  },
  {
    label: 'Quality assurance',
    description:
      'Technical review, documentation checks and a coordinated supply process — less specification and delivery risk.',
  },
  {
    label: 'B-BBEE status',
    description: 'B-BBEE level 2.',
  },
];

export const WHY_CHOOSE: WhyChooseReason[] = [
  {
    title: 'One Accountable Technical Team',
    description:
      'One team coordinates the whole lighting package, from design through to site — not split across providers.',
    icon: 'Users',
    iconImg: '/icons/why-team.svg',
  },
  {
    title: 'Technically Led Decisions',
    description:
      'Products and systems are chosen for the application — performance, compliance and design intent.',
    icon: 'Zap',
    iconImg: '/icons/why-technical.svg',
  },
  {
    title: 'Commercially Practical Solutions',
    description:
      'Value engineering that balances spec, cost and availability.',
    icon: 'TrendingUp',
    iconImg: '/icons/why-commercial.svg',
  },
  {
    title: 'Project-Led Supply',
    description:
      'Availability, documentation and delivery run to the project programme — not as separate transactions.',
    icon: 'Truck',
    iconImg: '/icons/why-supply.svg',
  },
  {
    title: 'Support Beyond Delivery',
    description:
      'Technical help and warranty support continue after the products reach site.',
    icon: 'Headphones',
    iconImg: '/icons/why-support.svg',
  },
  {
    title: 'Compliance-Backed Supply',
    description:
      'SABS, IEC and OSHACT-aligned documentation, manufacturer warranties and B-BBEE Level 2 — from specification to handover.',
    icon: 'ShieldCheck',
    iconImg: '/icons/why-compliance.svg',
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '1',
    title: 'Understand the project',
    iconImg: '/icons/process-understand.svg',
    description:
      'We review the brief, drawings, application, programme, design intent and budget.',
  },
  {
    number: '2',
    title: 'Design and specify',
    iconImg: '/icons/hero-design.svg',
    description:
      'We develop the lighting solution and pick the right luminaires, controls and systems.',
  },
  {
    number: '3',
    title: 'Optimise',
    iconImg: '/icons/hero-value-engineering.svg',
    description:
      'We value-engineer where it helps, without losing performance, compliance or design intent.',
  },
  {
    number: '4',
    title: 'Coordinate',
    iconImg: '/icons/hero-project-coordination.svg',
    description:
      'We manage technical submissions, product information and communication across the team.',
  },
  {
    number: '5',
    title: 'Supply and deliver',
    iconImg: '/icons/hero-supply.svg',
    description:
      'We coordinate procurement, availability and delivery to the site programme.',
  },
  {
    number: '6',
    title: 'Support',
    iconImg: '/icons/why-support.svg',
    description:
      'We help with commissioning, snags, replacements and warranty matters.',
  },
];

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    name: 'Commercial Office Development',
    location: 'Sandton, Johannesburg',
    scope: 'Lighting design, specification, supply and site coordination for a 12,000m² Grade-A office',
    delivered: 'Architectural linear lighting, recessed panels, emergency systems, and smart controls across 8 floors',
    category: 'Commercial Office Lighting',
    imageUrl: '/installation-images/modern-office-cove-lighting.jpeg',
    imageAlt: 'Modern executive office interior with ambient LED cove lighting and sleek workstation design.',
  },
  {
    name: 'Distribution Centre',
    location: 'Gauteng',
    scope: 'Highbay specification and supply for a 25,000m² logistics facility',
    delivered: 'V200 UFO highbays, linear racking illumination, emergency egress lighting, and external perimeter floods',
    category: 'Industrial & High-Bay Lighting',
    imageUrl: '/installation-images/industrial-warehouse-led-lighting.jpeg',
    imageAlt: 'Spacious empty warehouse with high open truss ceiling illuminated by rows of high-bay LED linear lights.',
  },
];

/** Real installation photography — application gallery shown on the Projects page. */
export const INSTALLATION_IMAGES: InstallationImage[] = [
  {
    src: '/installation-images/triangular-facade-accent-lighting.jpeg',
    alt: 'Triangular glass building facade with warm golden LED linear accent lighting at dusk.',
    category: 'Architectural Exterior',
    application: 'Dynamic LED facade illumination',
  },
  {
    src: '/installation-images/commercial-facade-slat-lighting.jpeg',
    alt: 'Multi-story commercial building exterior with vertical louvered LED strip lighting at night.',
    category: 'Architectural Exterior',
    application: 'Vertical slat illumination',
  },
  {
    src: '/installation-images/retail-track-lighting.png',
    alt: 'Luxury retail clothing store illuminated by black ceiling-mounted directional LED track spotlights.',
    category: 'Retail Lighting',
    application: 'Accent & spotlight solutions',
  },
  {
    src: '/installation-images/linear-pendant-office-lighting.jpeg',
    alt: 'Collaborative open office workspace with suspended black linear LED pendant lights over communal desks.',
    category: 'Office Lighting',
    application: 'Suspended linear & pendant',
  },
  {
    src: '/installation-images/open-ceiling-office-lighting.jpeg',
    alt: 'Open ceiling office design with suspended continuous LED linear fixtures over workstations.',
    category: 'Industrial Office',
    application: 'Continuous linear LEDs',
  },
  {
    src: '/installation-images/shopping-mall-cove-lighting.jpeg',
    alt: 'Luxury shopping mall concourse with continuous ceiling LED cove lighting and glass storefronts.',
    category: 'Public Space',
    application: 'Mall & concourse cove lighting',
  },
];

export const MANAGING_DIRECTOR: ManagingDirector = {
  name: 'Kaylen Reddy',
  role: 'Managing Director',
  phone: '083 499 5340',
  email: 'kaylen@lumenx.co.za',
  headshot: '/headshots/Kaylen-Reddy-Headshot.png',
  signatureImage: '/installation-images/lumenx-email-signature-kaylen.jpeg',
  signatureAlt: 'LumenX email signature banner for Kaylen Reddy, Managing Director.',
};

/** Homepage hero slideshow — all installation photography in curated order. */
export const HERO_SLIDES: InstallationImage[] = [
  {
    src: '/installation-images/triangular-facade-accent-lighting.jpeg',
    alt: 'Triangular glass building facade with warm golden LED linear accent lighting at dusk.',
    category: 'Architectural Exterior',
    application: 'Dynamic LED facade illumination',
  },
  {
    src: '/installation-images/modern-office-cove-lighting.jpeg',
    alt: 'Modern executive office interior with ambient LED cove lighting and sleek workstation design.',
    category: 'Commercial Office',
    application: 'Ambient cove lighting',
  },
  {
    src: '/installation-images/retail-track-lighting.png',
    alt: 'Luxury retail clothing store illuminated by black ceiling-mounted directional LED track spotlights.',
    category: 'Retail',
    application: 'Accent & spotlight solutions',
  },
  {
    src: '/installation-images/industrial-warehouse-led-lighting.jpeg',
    alt: 'Spacious empty warehouse with high open truss ceiling illuminated by rows of high-bay LED linear lights.',
    category: 'Industrial',
    application: 'High-bay installations',
  },
  {
    src: '/installation-images/commercial-facade-slat-lighting.jpeg',
    alt: 'Multi-story commercial building exterior with vertical louvered LED strip lighting at night.',
    category: 'Architectural Exterior',
    application: 'Vertical slat illumination',
  },
  {
    src: '/installation-images/linear-pendant-office-lighting.jpeg',
    alt: 'Collaborative open office workspace with suspended black linear LED pendant lights over communal desks.',
    category: 'Office',
    application: 'Suspended linear lighting',
  },
  {
    src: '/installation-images/open-ceiling-office-lighting.jpeg',
    alt: 'Open ceiling office design with suspended continuous LED linear fixtures over workstations.',
    category: 'Industrial Office',
    application: 'Continuous linear LEDs',
  },
  {
    src: '/installation-images/shopping-mall-cove-lighting.jpeg',
    alt: 'Luxury shopping mall concourse with continuous ceiling LED cove lighting and glass storefronts.',
    category: 'Public Space',
    application: 'Concourse cove lighting',
  },
];

export const AUDIENCE_PROFILES: AudienceProfile[] = [
  {
    title: 'Engineers and Consultants',
    iconImg: '/icons/audience-engineers.svg',
    description:
      'Design support, calculations, simulations, product data and specs — aligned to performance and compliance.',
  },
  {
    title: 'Contractors',
    iconImg: '/icons/audience-contractors.svg',
    description:
      'Responsive quotes, reviewed alternatives, supply coordination and practical help through installation.',
  },
  {
    title: 'Architects and Developers',
    iconImg: '/icons/audience-architects.svg',
    description:
      'Lighting that holds the design intent while staying buildable and on budget.',
  },
  {
    title: 'Procurement Teams',
    iconImg: '/icons/audience-procurement.svg',
    description:
      'Clear product info, competitive options, documented warranties and selections assessed on technical fit and whole-life value.',
  },
];

export const FAQS: FAQ[] = [
  {
    question: 'What do you handle in a lighting project?',
    answer:
      'Design, specification, value engineering, product selection, supply, coordination and after-sales support.',
  },
  {
    question: 'Do you work with existing consultants and contractors?',
    answer:
      'Yes. We slot into the existing team and work alongside engineers, consultants, architects, contractors, developers and procurement.',
  },
  {
    question: 'Where do you work?',
    answer:
      'Retail, commercial and industrial projects, nationwide across South Africa.',
  },
  {
    question: 'Can you quote from an existing BOQ or spec?',
    answer:
      'Yes. Send the BOQ, spec or drawings — we’ll review and quote.',
  },
  {
    question: 'Do you do lighting design and simulations?',
    answer:
      'Yes — layouts, calculations and simulations, scoped to the project.',
  },
  {
    question: 'Do you provide value engineering?',
    answer:
      'Yes. We find alternatives that cut cost without losing the required performance, compliance or design intent.',
  },
  {
    question: 'What warranties apply to your products?',
    answer:
      'They differ by product range and manufacturer, and are confirmed in the quotation and supporting docs.',
  },
  {
    question: 'Do you provide after-sales support?',
    answer:
      'Yes. Depending on the product and scope, we handle commissioning queries, snags, replacements and warranty matters.',
  },
];

export const CONTACT = {
  email: 'info@lumenx.co.za',
  projectsEmail: 'info@lumenx.co.za',
  phone: '+27 83 499 5340',
  website: 'www.lumenx.co.za',
  tagline: 'LIGHTING ENGINEERED FOR REAL PROJECTS',
};
