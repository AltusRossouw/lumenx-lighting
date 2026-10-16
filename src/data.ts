import {
  Industry,
  ComplianceItem,
  WhyChooseReason,
  CompanyOverview,
  CompleteSolutionCapability,
  ProcessStep,
  AudienceProfile,
  FAQ,
  InstallationImage,
  ManagingDirector,
  AboutPageContent,
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
export { PRODUCT_CATEGORIES, PRODUCTS_BY_CATEGORY, LIGHTING_CATEGORIES, SENSOR_CATEGORIES } from './products';

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
      'Products selected and supplied against SABS, IEC and OHSACT requirements.',
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
      'SABS, IEC and OHSACT-aligned documentation, manufacturer warranties and B-BBEE Level 2 — from specification to handover.',
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

export const MANAGING_DIRECTOR: ManagingDirector = {
  name: 'Kaylen Reddy',
  role: 'Managing Director',
  phone: '083 499 5340',
  email: 'kaylen@lumenx.co.za',
  headshot: '/headshots/Kaylen-Reddy-Headshot.png',
};

/**
 * About page copy — the founders' story.
 *
 * Each founder carries their own headshot, and both are supplied photographs
 * now — the "HEADSHOT TO BE SUPPLIED" placeholder that used to front Frans's
 * card is no longer referenced.
 *
 * Frans's is derived from `public/headshots/IMG_3557_Original.png` (2436x3045
 * PNG, 10.5 MB): resampled to 1080x1350, JPEG quality 88 + progressive, which
 * is ~300 KB. The source is already 4:5, so the card's `object-cover` never has
 * to crop his face. The 10.5 MB original stays untracked rather than going into
 * the repo and the Docker image.
 */
export const ABOUT_HEADSHOT_KAYLEN = '/headshots/Kaylen-Reddy-Headshot.png';
export const ABOUT_HEADSHOT_FRANS = '/headshots/Frans-Rossouw-Headshot.jpg';

export const ABOUT: AboutPageContent = {
  hero: {
    eyebrow: 'About LumenX',
    heading: { lead: 'The people behind ', accent: 'the projects', tail: '' },
    subcopy:
      'LumenX is two engineers with over 40 years of combined project experience — and every role in the lighting chain behind them.',
  },
  team: {
    label: 'The Team',
    heading: 'Two engineers. Over 40 years of experience on projects.',
    lede:
      'Engineer, specifier, supplier, manufacturer, operator: between them, Kaylen and Frans have held every one of these roles. They’ve drawn the single-lines, adjudicated the tenders, managed contractors on site, built the fittings and run the factories those fittings light. They know what the engineer needs on the drawing, what the contractor is up against on site, and what the client expects at handover. They’ve been there, and they know how to solve those problems.',
    highlights: [
      { value: '40+', label: 'Years of combined project experience' },
      { value: '18', label: 'Years Kaylen has spent in the lighting industry' },
      { value: '25+', label: 'Years of engineering and operational leadership behind Frans' },
      { value: '8 yr', label: 'Guarantee behind the luminaires Frans engineers' },
    ],
    members: [
      {
        name: 'Kaylen Reddy',
        role: 'Co-Founder & Managing Director',
        image: ABOUT_HEADSHOT_KAYLEN,
        imageAlt: 'Portrait of Kaylen Reddy, Co-Founder and Managing Director of LumenX Lighting.',
        focus: 'Kaylen sees the whole project, from the first drawing to delivery and aftercare.',
        blocks: [
          {
            body:
              'Kaylen holds a National Diploma in Electrical Engineering from the Durban University of Technology and began his career as a consulting engineer, working on MV and LV reticulation, industrial plants and commercial builds. He designed and specified systems, wrote and adjudicated tenders, ran FATs and managed contractors through to commissioning. From there he moved into lighting, first as a lighting solutions engineer and then as head of lighting. After that he spent six years running a regional business across KwaZulu-Natal, responsible for sales, operations, project delivery and the P&L.',
          },
          {
            body:
              'Eighteen years in the industry have taught him that lighting on a project has to be treated as one complete system, from first drawing to final handover. It needs one owner: someone technically sound who supplies the right product, understands every stakeholder on the job, delivers for each of them, and stays on after installation with proper aftercare. He co-founded LumenX to be that owner.',
          },
        ],
      },
      {
        name: 'Frans Rossouw',
        role: 'Co-Founder & Technical Director',
        image: ABOUT_HEADSHOT_FRANS,
        imageAlt: 'Portrait of Frans Rossouw, Co-Founder and Technical Director of LumenX Lighting.',
        focus:
          'Frans goes deep on the technical side: the product, the performance and the proof.',
        blocks: [
          {
            body:
              'Frans holds a master’s degree in electrical engineering from Stellenbosch, cum laude, and has more than 25 years of engineering and operational leadership behind him. He started in mining with a global resources group, where he designed protection grading for an 11 kV network with two 120 MVA substations, managed power quality across the mine’s distribution, and ran a 9 MW power plant before going on to manage its smelter and refinery. He then moved into large-scale manufacturing, where he installed what was then the largest heatset print press in South Africa and was responsible for health and safety across ten factories nationwide. He later became CEO of a national food manufacturer and tripled its turnover in three years. At every site, lighting audits and compliance with standards were part of his job.',
          },
          {
            body:
              'In 2015 he went a step further and started designing and manufacturing his own LED luminaires. They’re engineered in-house from the driver up, benchmarked against the best at international lighting fairs, and backed by an 8-year guarantee. Few people in the industry have built a light fitting from scratch. Frans has, and that hands-on product knowledge sits behind every specification LumenX puts its name to.',
          },
        ],
      },
    ],
  },
  closing: {
    heading: { lead: 'Together, they cover your project from ', accent: 'every angle', tail: '.' },
    subcopy:
      'Kaylen sees the whole project through, from the first drawing to delivery and aftercare. Frans goes deep on the product, the performance and the proof. Between them, nothing on the lighting scope is left unowned.',
    cta: 'Talk to the team about your project',
  },
};

/** Homepage hero slideshow — all installation photography in curated order. */
export const HERO_SLIDES: InstallationImage[] = [
  {
    src: '/installation-images/hero/facade-triangular.jpg',
    alt: 'Triangular glass building facade with warm golden LED linear accent lighting at dusk.',
    category: 'Architectural Exterior',
    application: 'Dynamic LED facade illumination',
  },
  {
    src: '/installation-images/hero/office-cove.jpg',
    alt: 'Modern executive office interior with ambient LED cove lighting and sleek workstation design.',
    category: 'Commercial Office',
    application: 'Ambient cove lighting',
  },
  {
    src: '/installation-images/hero/retail-track.jpg',
    alt: 'Luxury retail clothing store illuminated by black ceiling-mounted directional LED track spotlights.',
    category: 'Retail',
    application: 'Accent & spotlight solutions',
  },
  {
    src: '/installation-images/hero/warehouse-highbay.jpg',
    alt: 'Spacious empty warehouse with high open truss ceiling illuminated by rows of high-bay LED linear lights.',
    category: 'Industrial',
    application: 'High-bay installations',
  },
  {
    src: '/installation-images/hero/facade-slats.jpg',
    alt: 'Multi-story commercial building exterior with vertical louvered LED strip lighting at night.',
    category: 'Architectural Exterior',
    application: 'Vertical slat illumination',
  },
  {
    src: '/installation-images/hero/office-pendant.jpg',
    alt: 'Collaborative open office workspace with suspended black linear LED pendant lights over communal desks.',
    category: 'Office',
    application: 'Suspended linear lighting',
  },
  {
    src: '/installation-images/hero/office-linear.jpg',
    alt: 'Open ceiling office design with suspended continuous LED linear fixtures over workstations.',
    category: 'Industrial Office',
    application: 'Continuous linear LEDs',
  },
  {
    src: '/installation-images/hero/mall-cove.jpg',
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
