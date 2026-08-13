import {
  Service,
  ProductCategory,
  ProductDetail,
  Industry,
  ComplianceItem,
  WhyChooseReason,
  CompanyOverview,
  NavSection,
  CompleteSolutionCapability,
  ProcessStep,
  FeaturedProject,
  AudienceProfile,
  FAQ,
} from './types';

export const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCtixXadgYwhrFpYYaLMMI8uPOGQjsG_DLKEAHPRvCRAgNAyGCy7lmjYEH1fvWlL9FygFtBI5PMZwjTHvWdaekRg5hSVnaWyK5JUZixT0tfltpJF47LxVHFh9ZX7PBl9i65v61nci_HTweNE8jid_dOBgjkZMMI-JwlRawshv-poFsQT68QCi3G8_SsZV5Xqya01GgwskWABso8Xz27Pk0ZGdujIo725MFz75FsKbbye49gDJOnhHMT_yfn7_yX72ghPg';

export const NAV_SECTIONS: NavSection[] = [
  { id: 'complete-solution', label: 'The Solution' },
  { id: 'products', label: 'Products' },
  { id: 'projects', label: 'Projects' },
  { id: 'resources', label: 'Technical Resources' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export const COMPANY: CompanyOverview = {
  tagline: 'LIGHTING ENGINEERED FOR REAL PROJECTS',
  intro:
    'LumenX is a South African technical lighting partner for retail, commercial and industrial developments, owning every stage of a project from design to site delivery executed by one accountable team.',
  coreSpecialisation:
    'Technical lighting design, specification, supply and project coordination for commercial, retail and industrial environments.',
  geographicReach: 'South Africa — nationwide project support.',
  marketFocus: 'Retail, commercial and industrial lighting projects.',
  mission:
    'To bring stronger technical ownership into lighting delivery, so every project is specified, supplied and coordinated to a standard that protects performance and compliance.',
  vision:
    'To be the most accountable technical lighting partner in South African construction — known for projects that are technically sound, commercially practical and ready for site.',
  values:
    'Technical integrity, commercial practicality, project accountability, and support that continues beyond delivery.',
  team:
    'A focused technical and commercial team that owns the lighting package end to end — from first drawing review through to final site support.',
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
      'Fit-for-purpose products selected for performance, application and compliance.',
  },
  {
    title: 'Value Engineering',
    icon: '/icons/solution-value-engineering.svg',
    heroIcon: '/icons/hero-value-engineering.svg',
    description:
      'Commercial alternatives that protect the required technical outcome.',
  },
  {
    title: 'Supply',
    icon: '/icons/solution-supply.svg',
    heroIcon: '/icons/hero-supply.svg',
    description:
      'Product sourcing, availability and coordinated delivery aligned to the programme.',
  },
  {
    title: 'Project Coordination',
    icon: '/icons/solution-project-coordination.svg',
    heroIcon: '/icons/hero-project-coordination.svg',
    description:
      'Technical support across the project team from design development through to completion.',
  },
];

export const SERVICES: Service[] = [
  {
    title: 'Lighting Design',
    description:
      'Technical guidance that helps translate concept and design intent into coordinated, project-ready lighting solutions.',
    icon: 'Lightbulb',
  },
  {
    title: 'Product Specification & Selection',
    description:
      'Selection of fit-for-purpose luminaires and control options aligned to application, performance, budget, and compliance requirements. From products with 8-year guarantees to bespoke lighting for any application.',
    icon: 'ClipboardCheck',
  },
  {
    title: 'Value Engineering',
    description:
      'Practical optimisation of lighting solutions to protect performance, compliance, and design intent while improving cost efficiency.',
    icon: 'TrendingUp',
  },
  {
    title: 'Project Supply & Site Delivery',
    description:
      'Managed supply, logistics, and delivery coordination to ensure the right products arrive in the right sequence for installation timeously.',
    icon: 'Truck',
  },
  {
    title: 'Project Coordination',
    description:
      'Close collaboration with consultants, contractors, developers, and procurement teams to keep the lighting package aligned throughout execution.',
    icon: 'Users',
  },
  {
    title: 'Smart Lighting & Controls',
    description:
      'Support for intelligent lighting systems, control integration, and energy-efficient solutions that improve usability and long-term performance.',
    icon: 'Cpu',
  },
  {
    title: 'After-Sales Technical Support',
    description:
      'Ongoing support for commissioning queries, replacements, snag resolution, and product performance issues where required. Service guarantees for full duration.',
    icon: 'Headphones',
  },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'architectural',
    title: 'Architectural and Commercial Lighting',
    description:
      'Interior and exterior lighting for visual comfort, design quality and dependable performance in commercial environments.',
    applications: 'Offices, retail, hospitality, healthcare and education',
    imageUrl:
      'https://images.unsplash.com/photo-1565538810844-1e119412e866?auto=format&fit=crop&w=600&q=80',
    linkLabel: 'Explore Architectural and Commercial Lighting',
  },
  {
    id: 'industrial',
    title: 'Industrial and Warehouse Lighting',
    description:
      'High-output, durable lighting for demanding operational spaces, high ceilings, racking layouts and efficient maintenance cycles.',
    applications: 'Warehouses, logistics, manufacturing and production facilities',
    imageUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    linkLabel: 'Explore Industrial and Warehouse Lighting',
  },
  {
    id: 'street',
    title: 'Street and Outdoor Lighting',
    description:
      'Reliable exterior lighting designed around roadway performance, security, durability and long-term maintenance.',
    applications: 'Roads, public spaces, industrial yards and perimeter lighting',
    imageUrl:
      'https://images.unsplash.com/photo-1548345680-f5475ea5df84?auto=format&fit=crop&w=600&q=80',
    linkLabel: 'Explore Street and Outdoor Lighting',
  },
  {
    id: 'emergency',
    title: 'Emergency and Compliance Lighting',
    description:
      'Emergency fittings and systems supporting escape routes, wayfinding and project safety requirements.',
    applications: 'Public buildings, fire stairs, parking structures and industrial egress routes',
    imageUrl:
      'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80',
    linkLabel: 'Explore Emergency Lighting',
  },
  {
    id: 'smart',
    title: 'Smart Lighting and Controls',
    description:
      'Controls, sensors and BMS-compatible lighting systems designed to improve energy performance, usability and operational control.',
    applications: 'Commercial buildings, industrial operations and managed facilities',
    imageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    linkLabel: 'Explore Smart Lighting and Controls',
  },
  {
    id: 'orbitx',
    title: 'OrbitX Direct Drive LED Lighting',
    description:
      'Premium South African-engineered lighting for demanding industrial, commercial and mining applications.',
    applications: 'Projects requiring advanced performance, durability and lifecycle value',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80',
    linkLabel: 'Explore OrbitX',
  },
];
export const PRODUCTS_BY_CATEGORY: Record<string, ProductDetail[]> = {
  architectural: [
    { name: '9W Surface Downlight', description: 'Compact surface-mounted LED downlight for retail, hospitality and residential applications. Clean aesthetic with high CRI for accurate colour rendering.', specs: [{label:'Wattage',value:'9W'},{label:'Lumens',value:'1,250lm'},{label:'IP Rating',value:'IP20'},{label:'CRI',value:'90+'},{label:'CCT',value:'3000K / 4000K / 6000K'},{label:'Beam Angle',value:'60°'},{label:'Housing',value:'Die-cast aluminum'},{label:'Lifetime',value:'L70B50 > 50,000 hrs'}], applications: ['Retail stores','Hospitality','Residential','Corridors'], imageUrl: '/product-images/9w_Surface_downlight.png', pdfUrl: '/datasheets/LumenX_Datasheet_9w Surface downlight.pdf' },
    { name: 'Aegeon Diffused Downlight', description: 'Premium diffused downlight with soft, uniform light distribution. Ideal for spaces requiring visual comfort and glare-free illumination.', specs: [{label:'Wattage',value:'12W – 24W'},{label:'Lumens',value:'1,440lm – 2,880lm'},{label:'IP Rating',value:'IP20 / IP44'},{label:'CRI',value:'90+'},{label:'CCT',value:'3000K / 4000K'},{label:'Beam Angle',value:'90°'},{label:'Cutout',value:'Ø68 – Ø205mm'},{label:'Lifetime',value:'L80B10 > 50,000 hrs'}], applications: ['Corporate offices','Healthcare','Education','High-end retail'], imageUrl: '/product-images/Aegeon_Downlight.png', pdfUrl: '/datasheets/LumenX_Datasheet_Aegeon Downlight.pdf' },
    { name: '35W Track Spot', description: 'High-output LED track spot with adjustable beam. Precision optics for accent and display lighting in retail, galleries, and showrooms.', specs: [{label:'Wattage',value:'35W'},{label:'Lumens',value:'3,500lm'},{label:'IP Rating',value:'IP20'},{label:'CRI',value:'90+'},{label:'CCT',value:'3000K / 4000K'},{label:'Beam Angle',value:'15° / 24° / 38°'},{label:'Track',value:'3-Circuit compatible'},{label:'Lifetime',value:'L80B10 > 50,000 hrs'}], applications: ['Art galleries','Auto showrooms','Fashion retail','Museum exhibits'], imageUrl: '/product-images/35W_Track_Spot.png', pdfUrl: '/datasheets/LumenX_Datasheet_35W Track Spot.pdf' },
    { name: 'Recessed Panel 600x600', description: 'Standard 600x600mm recessed LED panel for T-bar ceiling grids. Uniform edge-to-edge illumination with flicker-free driver.', specs: [{label:'Wattage',value:'24W'},{label:'Lumens',value:'3,600lm'},{label:'IP Rating',value:'IP40'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5700K'},{label:'Dimensions',value:'595×595mm'},{label:'Driver',value:'Flicker-free'},{label:'Lifetime',value:'L80B10 > 50,000 hrs'}], applications: ['Corporate offices','Call centres','Schools','Retail stores'], imageUrl: '/product-images/Recessed_Panel.png', pdfUrl: '/datasheets/LumenX_Datasheet_Recessed Panel.pdf' },
    { name: 'Recessed Panel 300x1200', description: 'Wide-format 300×1200mm recessed LED panel. Ideal for modern architectural ceiling layouts requiring elongated linear illumination.', specs: [{label:'Wattage',value:'24W'},{label:'Lumens',value:'3,600lm'},{label:'IP Rating',value:'IP40'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5700K'},{label:'Dimensions',value:'295×1195mm'},{label:'Driver',value:'Flicker-free'},{label:'Lifetime',value:'L80B10 > 50,000 hrs'}], applications: ['Architectural offices','Boardrooms','Reception areas','Corridors'], imageUrl: '/product-images/300x1200_Recessed_Panel.png', pdfUrl: '/datasheets/LumenX_Datasheet_300x1200 Recessed Panel.pdf' },
    { name: 'Linear 50x83mm', description: 'High-output extruded aluminum linear profile. Continuous seamless linking for modern office and commercial lighting designs.', specs: [{label:'Wattage',value:'54W – 65W'},{label:'Lumens',value:'4,847lm – 5,817lm'},{label:'IP Rating',value:'IP20'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5700K'},{label:'Profile',value:'50×83mm extruded'},{label:'Mounting',value:'Suspended / Surface'},{label:'Lifetime',value:'L80B10 > 60,000 hrs'}], applications: ['Modern offices','Design studios','Academic libraries','Atriums'], imageUrl: '/product-images/Linear_50x83mm.png', pdfUrl: '/datasheets/LumenX_Datasheet_Linear 50x83mm.pdf' },
    { name: 'Linear 50x83mm 30W/m', description: 'Energy-efficient linear profile at 30W per meter. Continuous run capability with high-transmittance opal diffuser for smooth light distribution.', specs: [{label:'Wattage',value:'30W per meter'},{label:'Efficacy',value:'100 lm/W'},{label:'IP Rating',value:'IP20'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K'},{label:'Profile',value:'50×83mm extruded'},{label:'Mounting',value:'Suspended / Surface'},{label:'Lifetime',value:'L80B10 > 60,000 hrs'}], applications: ['Open-plan offices','Reception desks','Retail displays','Corridors'], imageUrl: '/product-images/Linear_50x83mm_30W:m.png', pdfUrl: '/datasheets/LumenX_Datasheet_Linear 50x83mm 30W:m.pdf' },
  ],
  industrial: [
    { name: 'Saxa Triproof', description: 'Heavy-duty triproof linear fitting rated IP65 for dust, water, and impact. Designed for parking structures, food processing, and harsh industrial environments.', specs: [{label:'Wattage',value:'18W – 54W'},{label:'Lumens',value:'2,160lm – 6,480lm'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5000K'},{label:'Housing',value:'Polycarbonate + stainless clips'},{label:'Mounting',value:'Surface / Suspended'},{label:'Lifetime',value:'L80B10 > 50,000 hrs'}], applications: ['Parking garages','Food processing','Warehouses','Industrial washdown'], imageUrl: '/product-images/Saxa_Triproof.png', pdfUrl: '/datasheets/LumenX_Datasheet_Saxa Triproof.pdf' },
    { name: '48W 3CCT Tri-Proof Linear', description: '5ft switchable-colour-temperature triproof linear. Three CCT options in one fitting — 3000K, 4000K, 5700K — selectable via internal switch.', specs: [{label:'Wattage',value:'48W'},{label:'Lumens',value:'7,200lm'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'80+'},{label:'CCT',value:'3000K / 4000K / 5700K (switchable)'},{label:'Length',value:'5ft / 1500mm'},{label:'Housing',value:'Polycarbonate'},{label:'Lifetime',value:'L80B10 > 50,000 hrs'}], applications: ['Parking structures','Canopies','Industrial corridors','Loading bays'], imageUrl: '/product-images/48W_3_CCT_Triproof.png', pdfUrl: '/datasheets/LumenX_Datasheet_48W 3 CCT Triproof.pdf' },
    { name: 'ALU Bulkhead', description: 'Rugged die-cast aluminum bulkhead with high thermal dissipation. IP65 rated for outdoor and industrial wall/ceiling mounting with impact-resistant diffuser.', specs: [{label:'Wattage',value:'12W – 18W'},{label:'Lumens',value:'1,560lm – 2,340lm'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5000K'},{label:'Housing',value:'Die-cast aluminum'},{label:'Mounting',value:'Wall / Ceiling surface'},{label:'Lifetime',value:'L70B50 > 50,000 hrs'}], applications: ['Industrial walkways','Stairwells','External corridors','Loading docks'], imageUrl: '/product-images/ALU_BLUKHEAD.png', pdfUrl: '/datasheets/LumenX_Datasheet_ALU BLUKHEAD.pdf' },
    { name: 'PC Bulkhead', description: 'Cost-effective polycarbonate bulkhead with anti-tamper screws. UV-stabilised housing prevents yellowing — ideal for public and semi-public areas.', specs: [{label:'Wattage',value:'12W – 24W'},{label:'Lumens',value:'1,260lm – 2,280lm'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5000K'},{label:'Housing',value:'UV-stabilised polycarbonate'},{label:'Mounting',value:'Wall / Ceiling surface'},{label:'Lifetime',value:'L70B50 > 50,000 hrs'}], applications: ['Public stairwells','Underground parking','Community halls','Storage rooms'], imageUrl: '/product-images/PC_BLUKHEAD.png', pdfUrl: '/datasheets/LumenX_Datasheet_PC BLUKHEAD.pdf' },
    { name: 'V200 UFO Highbay', description: 'High-performance 160W UFO highbay with exceptional 32,000lm output. Passive cooling fin design for silent, maintenance-free operation in high-ceiling industrial spaces.', specs: [{label:'Wattage',value:'160W'},{label:'Lumens',value:'32,000lm'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5000K'},{label:'Beam Angle',value:'60° / 90° / 120°'},{label:'Mounting',value:'Ring hook / Bracket'},{label:'Lifetime',value:'L90B10 > 85,000 hrs'}], applications: ['Manufacturing plants','Logistics warehouses','Assembly halls','Exhibition centres'], imageUrl: '/product-images/V200_Highbay.png', pdfUrl: '/datasheets/LumenX_Datasheet_V200 Highbay.pdf' },
    { name: 'Thermisto Linear Highbay', description: 'Versatile linear highbay with wide wattage range and excellent thermal management. Ideal for racking aisles, production lines, and medium-height industrial ceilings.', specs: [{label:'Wattage',value:'17W – 100W'},{label:'Lumens',value:'2,300lm – 12,000lm'},{label:'IP Rating',value:'IP40'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5000K'},{label:'Profile',value:'55×80mm extruded'},{label:'Mounting',value:'Suspended / Surface'},{label:'Lifetime',value:'L80B10 > 60,000 hrs'}], applications: ['Warehouse racking','Production lines','Distribution centres','Cold storage'], imageUrl: '/product-images/Thermisto.png', pdfUrl: '/datasheets/LumenX_Datasheet_Thermisto.pdf' },
    { name: 'LF55x80 Linear Fitting', description: 'Compact 55×80mm linear profile with high lumen output. Optimised for narrow aisle and racking illumination in logistics and warehousing environments.', specs: [{label:'Wattage',value:'17W – 100W'},{label:'Lumens',value:'2,300lm – 12,000lm'},{label:'IP Rating',value:'IP40'},{label:'CRI',value:'80+'},{label:'CCT',value:'4000K / 5000K'},{label:'Profile',value:'55×80mm extruded'},{label:'Mounting',value:'Suspended / Surface'},{label:'Lifetime',value:'L80B10 > 60,000 hrs'}], applications: ['Narrow aisles','Racking rows','Logistics centres','Storage facilities'], imageUrl: '/product-images/LF55x80.png', pdfUrl: '/datasheets/LumenX_Datasheet_LF55x80.pdf' },
  ],
  street: [
    { name: '60W Street Light', description: 'Municipal-grade LED street light with precision roadway optics. Tool-free top opening for streamlined maintenance. Zero upward light ratio for dark-sky compliance.', specs: [{label:'Wattage',value:'60W'},{label:'Lumens',value:'10,200lm'},{label:'IP Rating',value:'IP66'},{label:'CRI',value:'70+ (80 option)'},{label:'CCT',value:'3000K / 4000K'},{label:'Optics',value:'Type II / III Roadway'},{label:'Surge',value:'10kV'},{label:'Lifetime',value:'L90B10 > 100,000 hrs'}], applications: ['Residential streets','Urban roads','Industrial access','Public parks'], imageUrl: '/product-images/60W_Street_light.png', pdfUrl: '/datasheets/LumenX_Datasheet_60W Street light.pdf' },
    { name: 'Performance Floods', description: 'High-power floodlight series from 10W to 175W. Asymmetric and symmetric beam options for area lighting, sports facilities, and security perimeters.', specs: [{label:'Wattage',value:'10W – 175W'},{label:'Lumens',value:'1,250lm – 22,500lm'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'70+ (80 option)'},{label:'CCT',value:'4000K / 5000K'},{label:'Beam',value:'Asymmetric / Symmetric'},{label:'Mounting',value:'Adjustable steel bracket'},{label:'Lifetime',value:'L90B10 > 100,000 hrs'}], applications: ['Sports fields','Harbour berths','Mining yards','Perimeter security'], imageUrl: '/product-images/Performance_Floods.png', pdfUrl: '/datasheets/LumenX_Datasheet_Performance Floods.pdf' },
  ],
  emergency: [
    { name: 'ALU Bulkhead Emergency', description: 'Emergency variant of the aluminum bulkhead with integrated 3-hour battery backup. Self-test functionality for automated compliance reporting.', specs: [{label:'Wattage',value:'12W – 18W'},{label:'Lumens',value:'1,560lm – 2,340lm'},{label:'IP Rating',value:'IP65'},{label:'Battery',value:'LiFePO4 3hr'},{label:'CCT',value:'5000K'},{label:'Testing',value:'Self-test micro-logic'},{label:'Housing',value:'Die-cast aluminum'},{label:'Lifetime',value:'L70B50 > 50,000 hrs'}], applications: ['Emergency exits','Fire stairs','Industrial egress','Public buildings'], imageUrl: '/product-images/ALU_BLUKHEAD.png', pdfUrl: '/datasheets/LumenX_Datasheet_ALU BLUKHEAD.pdf' },
    { name: 'PC Bulkhead Emergency', description: 'Emergency variant of the polycarbonate bulkhead. Cost-effective compliant solution for escape route illumination with 3-hour autonomy.', specs: [{label:'Wattage',value:'12W – 24W'},{label:'Lumens',value:'1,260lm – 2,280lm'},{label:'IP Rating',value:'IP65'},{label:'Battery',value:'LiFePO4 3hr'},{label:'CCT',value:'5000K'},{label:'Testing',value:'Manual test switch'},{label:'Housing',value:'UV-stabilised polycarbonate'},{label:'Lifetime',value:'L70B50 > 50,000 hrs'}], applications: ['Stairwells','Basement parking','Community halls','Exit routes'], imageUrl: '/product-images/PC_BLUKHEAD.png', pdfUrl: '/datasheets/LumenX_Datasheet_PC BLUKHEAD.pdf' },
  ],
  smart: [
    { name: 'High Voltage Strip', description: 'Flexible high-voltage LED strip operable directly from 220-240V mains. No driver required — cuttable every metre with IP65 outdoor rating for architectural accent lighting.', specs: [{label:'Wattage',value:'9W/m – 14W/m'},{label:'Lumens',value:'850lm/m – 1,400lm/m'},{label:'IP Rating',value:'IP65'},{label:'CRI',value:'80+'},{label:'CCT',value:'3000K / 4000K / 6000K'},{label:'Voltage',value:'220-240V AC direct'},{label:'Cuttable',value:'Every 1 metre'},{label:'Lifetime',value:'L80B10 > 30,000 hrs'}], applications: ['Facade accent','Cove lighting','Landscape edges','Signage illumination'], imageUrl: '/product-images/High_Voltage_Strip.png', pdfUrl: '/datasheets/LumenX_Datasheet_High Voltage Strip.pdf' },
    { name: 'COB Strip', description: 'Chip-on-board LED strip delivering continuous dot-free linear light. High-density COB technology for seamless illumination in architectural cove and display applications.', specs: [{label:'Wattage',value:'10W'},{label:'Lumens',value:'1,100lm'},{label:'IP Rating',value:'IP20'},{label:'CRI',value:'90+'},{label:'CCT',value:'3000K / 4000K'},{label:'Type',value:'COB (Chip-on-Board)'},{label:'Voltage',value:'24V DC'},{label:'Lifetime',value:'L80B10 > 30,000 hrs'}], applications: ['Display shelving','Cove details','Under-cabinet','Joinery accent'], imageUrl: '/product-images/COB_STRIP.png', pdfUrl: '/datasheets/LumenX_Datasheet_COB STRIP.pdf' },
  ],
  orbitx: [],
};

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
      'Products selected and supplied with consideration for applicable SABS, IEC, OSHACT and relevant project compliance requirements.',
  },
  {
    label: 'Energy performance',
    description:
      'Focus on efficient LED and control-based solutions that support project energy targets and lifecycle value.',
  },
  {
    label: 'Warranty support',
    description:
      'Industry-leading manufacturer-backed warranty terms communicated clearly per product range and project scope.',
  },
  {
    label: 'Quality assurance',
    description:
      'Technical review, documentation checks, and coordinated supply processes to reduce specification and delivery risk.',
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
      'The complete lighting project is coordinated from design through to site delivery rather than fragmented across disconnected providers.',
    icon: 'Users',
    iconImg: '/icons/why-team.svg',
  },
  {
    title: 'Technically Led Decisions',
    description:
      'Products and systems are selected around application, performance, compliance, design intent and project requirements.',
    icon: 'Zap',
    iconImg: '/icons/why-technical.svg',
  },
  {
    title: 'Commercially Practical Solutions',
    description:
      'Value engineering balances technical integrity, project cost, availability and lifecycle value.',
    icon: 'TrendingUp',
    iconImg: '/icons/why-commercial.svg',
  },
  {
    title: 'Project-Led Supply',
    description:
      'Product availability, technical documentation and delivery are managed around the project programme, not treated as separate transactions.',
    icon: 'Truck',
    iconImg: '/icons/why-supply.svg',
  },
  {
    title: 'Support Beyond Delivery',
    description:
      'Technical assistance and applicable warranty support continue after products reach the site.',
    icon: 'Headphones',
    iconImg: '/icons/why-support.svg',
  },
  {
    title: 'Compliance-Backed Supply',
    description:
      'SABS, IEC and OSHACT-aligned documentation, manufacturer-backed warranties and B-BBEE Level 2 credentials support the project from specification to handover.',
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
      'We review the brief, drawings, application, programme, design intent and commercial requirements.',
  },
  {
    number: '2',
    title: 'Design and specify',
    iconImg: '/icons/hero-design.svg',
    description:
      'We develop the lighting solution and select technically appropriate luminaires, controls and systems.',
  },
  {
    number: '3',
    title: 'Optimise',
    iconImg: '/icons/hero-value-engineering.svg',
    description:
      'We value engineer where required while protecting performance, compliance and design intent.',
  },
  {
    number: '4',
    title: 'Coordinate',
    iconImg: '/icons/hero-project-coordination.svg',
    description:
      'We manage technical submissions, product information and communication across the project team.',
  },
  {
    number: '5',
    title: 'Supply and deliver',
    iconImg: '/icons/hero-supply.svg',
    description:
      'We coordinate procurement, availability and delivery in line with site and installation requirements.',
  },
  {
    number: '6',
    title: 'Support',
    iconImg: '/icons/why-support.svg',
    description:
      'We assist with commissioning queries, snag resolution, replacements and applicable warranty matters.',
  },
];

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    name: 'Commercial Office Development',
    location: 'Sandton, Johannesburg',
    scope: 'Full lighting design, specification, supply and site coordination for 12,000m² Grade-A office',
    delivered: 'Architectural linear lighting, recessed panels, emergency systems, and smart controls across 8 floors',
  },
  {
    name: 'Distribution Centre',
    location: 'Gauteng',
    scope: 'Industrial highbay specification and supply for 25,000m² logistics facility',
    delivered: 'V200 UFO highbays, linear racking illumination, emergency egress lighting, and external perimeter floods',
  },
];

export const AUDIENCE_PROFILES: AudienceProfile[] = [
  {
    title: 'Engineers and Consultants',
    iconImg: '/icons/audience-engineers.svg',
    description:
      'Lighting design support, calculations, simulations, product data and specifications aligned to performance and compliance requirements.',
  },
  {
    title: 'Contractors',
    iconImg: '/icons/audience-contractors.svg',
    description:
      'Responsive quotations, technically reviewed alternatives, supply coordination and practical support through installation.',
  },
  {
    title: 'Architects and Developers',
    iconImg: '/icons/audience-architects.svg',
    description:
      'Lighting solutions that protect design intent while remaining buildable, available and commercially viable.',
  },
  {
    title: 'Procurement Teams',
    iconImg: '/icons/audience-procurement.svg',
    description:
      'Clear product information, competitive options, documented warranties and selections assessed against technical fit and lifecycle value.',
  },
];

export const FAQS: FAQ[] = [
  {
    question: 'What does LumenX manage within a lighting project?',
    answer:
      'LumenX supports lighting design, specification, value engineering, product selection, supply, technical coordination, site delivery and applicable after-sales support.',
  },
  {
    question: 'Does LumenX work with existing consultants and contractors?',
    answer:
      'Yes. LumenX integrates into the existing project team and works alongside engineers, consultants, architects, contractors, developers and procurement teams.',
  },
  {
    question: 'Where does LumenX support lighting projects?',
    answer:
      'LumenX supports retail, commercial and industrial lighting projects across South Africa.',
  },
  {
    question: 'Can LumenX quote from an existing BOQ or lighting specification?',
    answer:
      'Yes. Project teams can submit a BOQ, specification or drawings for technical review, product selection and quotation.',
  },
  {
    question: 'Does LumenX provide lighting design and simulations?',
    answer:
      'Yes. LumenX provides project-specific lighting design support, calculations and simulations according to the agreed project scope.',
  },
  {
    question: 'Does LumenX provide value engineering?',
    answer:
      'Yes. LumenX assesses alternative products and solutions to improve commercial value while protecting the required performance, compliance and design intent.',
  },
  {
    question: 'What warranties apply to LumenX products?',
    answer:
      'Warranty terms differ by product range and manufacturer. Applicable warranty terms are confirmed in the quotation and supporting technical documentation.',
  },
  {
    question: 'Does LumenX provide after-sales support?',
    answer:
      'Yes. Depending on the product and agreed scope, LumenX supports commissioning queries, snag resolution, replacements and warranty matters.',
  },
];

export const CONTACT = {
  email: 'kaylen@lumenx.co.za',
  projectsEmail: 'projects@lumenx.co.za',
  phone: '+27 83 499 5340',
  website: 'www.lumenx.co.za',
  tagline: 'LIGHTING ENGINEERED FOR REAL PROJECTS',
};
