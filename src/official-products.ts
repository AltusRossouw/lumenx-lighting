import type { Product } from './types';
import { SCRAPED_PRODUCTS } from './catalogue-scraped';

const officialSheet = (filename: string) => `/catalogues/lumenx/${filename}`;

const createOfficialProduct = ({
  slug,
  name,
  category,
  summary,
  description,
  image,
  specs,
  features,
  applications,
  sheet,
}: {
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  image: string;
  specs: { label: string; value: string }[];
  features: string[];
  applications: string[];
  sheet: string;
}): Product => ({
  slug,
  name,
  category,
  summary,
  description,
  specs,
  features,
  applications,
  imageUrl: image,
  images: [{ src: image, fit: 'contain', alt: name }],
  pdfUrl: officialSheet(sheet),
});

const fromScraped = (
  category: string,
  slug: string,
  name: string,
  sheet: string,
  options: { publicSlug?: string; hero?: string } = {},
): Product => {
  const product = SCRAPED_PRODUCTS.find((item) => item.category === category && item.slug === slug);
  if (!product) throw new Error(`Missing scraped product: ${category}/${slug}`);
  const hero = options.hero ?? product.imageUrl;
  return {
    ...product,
    slug: options.publicSlug ?? slug,
    name,
    pdfUrl: officialSheet(sheet),
    imageUrl: hero,
    images: [{ src: hero, fit: 'contain', alt: name }, ...(product.images ?? []).filter((image) => image.src !== hero)],
  };
};

export const OFFICIAL_PRODUCTS: Product[] = [
  createOfficialProduct({
    slug: 'alu-bulkhead', name: 'ALU Bulkhead', category: 'bulkheads',
    summary: 'Rugged die-cast aluminium bulkhead for outdoor and industrial wall or ceiling mounting.',
    description: 'A rugged IP65 aluminium bulkhead with high thermal dissipation and impact-resistant construction for demanding project environments.',
    image: '/product-images/ALU_BLUKHEAD.png',
    specs: [{ label: 'Wattage', value: '12W – 18W' }, { label: 'IP Rating', value: 'IP65' }, { label: 'Housing', value: 'Die-cast aluminium' }, { label: 'Mounting', value: 'Wall / ceiling surface' }],
    features: ['Die-cast aluminium housing', 'IP65 protection', 'Impact-resistant diffuser'],
    applications: ['Industrial walkways', 'Stairwells', 'External corridors', 'Loading docks'],
    sheet: 'lumenx-datasheet-alu-blukhead.pdf',
  }),
  createOfficialProduct({
    slug: 'pc-bulkhead', name: 'PC Bulkhead', category: 'bulkheads',
    summary: 'Cost-effective polycarbonate bulkhead with UV-stabilised housing for public and semi-public areas.',
    description: 'A durable IP65 polycarbonate bulkhead with anti-tamper construction and UV-stabilised housing for reliable general and emergency applications.',
    image: '/product-images/PC_BLUKHEAD.png',
    specs: [{ label: 'Wattage', value: '12W – 24W' }, { label: 'IP Rating', value: 'IP65' }, { label: 'Housing', value: 'UV-stabilised polycarbonate' }, { label: 'Mounting', value: 'Wall / ceiling surface' }],
    features: ['UV-stabilised housing', 'Anti-tamper screws', 'IP65 protection'],
    applications: ['Public stairwells', 'Underground parking', 'Community halls', 'Storage rooms'],
    sheet: 'lumenx-datasheet-pc-blukhead.pdf',
  }),
  createOfficialProduct({
    slug: '9w-surface-downlight', name: '9W Surface Downlight', category: 'downlights',
    summary: 'Compact surface-mounted LED downlight for retail, hospitality and residential applications.',
    description: 'A compact surface-mounted LED downlight with high CRI and a clean form for retail, hospitality, residential and circulation spaces.',
    image: '/product-images/9w_Surface_downlight.png',
    specs: [{ label: 'Wattage', value: '9W' }, { label: 'Lumens', value: '1,250 lm' }, { label: 'IP Rating', value: 'IP20' }, { label: 'CRI', value: '90+' }, { label: 'Beam Angle', value: '60°' }],
    features: ['High CRI output', 'Surface-mounted format', '3000K / 4000K / 6000K'],
    applications: ['Retail stores', 'Hospitality', 'Residential', 'Corridors'],
    sheet: 'lumenx-datasheet-9w-surface-downlight.pdf',
  }),
  fromScraped('downlights', 'diffused-downlight', 'Diffused Downlight', 'lumenx-datasheet-aegeon-downlight.pdf', { hero: '/product-images/Aegeon_Downlight.png' }),
  fromScraped('floods', 'flood', 'Performance Floods', 'lumenx-datasheet-performance-floods.pdf', { hero: '/product-images/Performance_Floods.png' }),
  createOfficialProduct({
    slug: '60w-street-light', name: '60W Street Light', category: 'floods',
    summary: 'Municipal-grade LED street light with precision roadway optics and zero upward light ratio.',
    description: 'A high-output roadway luminaire with tool-free top opening, precision optics and dark-sky-conscious performance for municipal and access-road projects.',
    image: '/product-images/60W_Street_light.png',
    specs: [{ label: 'Wattage', value: '60W' }, { label: 'Lumens', value: '10,200 lm' }, { label: 'IP Rating', value: 'IP66' }, { label: 'Optics', value: 'Type II / III roadway' }, { label: 'Surge Protection', value: '10kV' }],
    features: ['Precision roadway optics', 'Tool-free top opening', 'Zero upward light ratio'],
    applications: ['Residential streets', 'Urban roads', 'Industrial access', 'Public parks'],
    sheet: 'lumenx-datasheet-60w-street-light.pdf',
  }),
  createOfficialProduct({
    slug: 'v200-highbay', name: 'V200 UFO Highbay', category: 'highbays',
    summary: 'High-performance 160W UFO highbay delivering up to 32,000 lumens for high-ceiling industrial spaces.',
    description: 'A high-output UFO highbay with passive cooling and multiple beam options for manufacturing, logistics and other high-ceiling environments.',
    image: '/product-images/V200_Highbay.png',
    specs: [{ label: 'Wattage', value: '160W' }, { label: 'Lumens', value: '32,000 lm' }, { label: 'IP Rating', value: 'IP65' }, { label: 'Beam Angle', value: '60° / 90° / 120°' }, { label: 'Mounting', value: 'Ring hook / bracket' }],
    features: ['32,000 lm output', 'Passive cooling', 'Multiple beam options'],
    applications: ['Manufacturing plants', 'Logistics warehouses', 'Assembly halls', 'Exhibition centres'],
    sheet: 'lumenx-datasheet-v200-highbay.pdf',
  }),
  fromScraped('highbays', 'thermisto', 'Thermisto', 'lumenx-datasheet-thermisto.pdf', { hero: '/product-images/Thermisto.png' }),
  createOfficialProduct({
    slug: '300x1200-recessed-panel', name: '300x1200 Recessed Panel', category: 'panels',
    summary: 'Wide-format recessed LED panel for modern architectural ceiling layouts.',
    description: 'A 300x1200mm recessed LED panel delivering uniform, flicker-free illumination for elongated architectural ceiling layouts.',
    image: '/product-images/300x1200_Recessed_Panel.png',
    specs: [{ label: 'Wattage', value: '24W' }, { label: 'Lumens', value: '3,600 lm' }, { label: 'IP Rating', value: 'IP40' }, { label: 'Dimensions', value: '295 x 1195mm' }, { label: 'Driver', value: 'Flicker-free' }],
    features: ['Uniform edge-to-edge illumination', 'Flicker-free driver', 'Architectural 300x1200 format'],
    applications: ['Architectural offices', 'Boardrooms', 'Reception areas', 'Corridors'],
    sheet: 'lumenx-datasheet-300x1200-recessed-panel.pdf',
  }),
  createOfficialProduct({
    slug: 'high-voltage-strip', name: 'High Voltage Strip', category: 'strips',
    summary: 'Flexible high-voltage LED strip operating directly from 220–240V mains without a driver.',
    description: 'A cuttable high-voltage LED strip for architectural accent lighting, signage and landscape edges, with IP65 outdoor protection.',
    image: '/product-images/High_Voltage_Strip.png',
    specs: [{ label: 'Wattage', value: '9W/m – 14W/m' }, { label: 'IP Rating', value: 'IP65' }, { label: 'Voltage', value: '220–240V AC direct' }, { label: 'Cutting', value: 'Every 1 metre' }, { label: 'CRI', value: '80+' }],
    features: ['No driver required', 'Cuttable every metre', 'Outdoor-rated construction'],
    applications: ['Facade accent', 'Cove lighting', 'Landscape edges', 'Signage illumination'],
    sheet: 'lumenx-datasheet-high-voltage-strip.pdf',
  }),
  fromScraped('linears', 'puck-seamless', 'Puck Seamless', 'lumenx-datasheet-puck-seamless.pdf', { hero: '/product-images/puck-seamless.png' }),
  fromScraped('linears', 'lds5083', 'Linear 50x83mm', 'lumenx-datasheet-linear-50x83mm.pdf', { hero: '/product-images/Linear_50x83mm.png' }),
  fromScraped('linears', 'lf55', 'LF55x80', 'lumenx-datasheet-lf55x80.pdf', { hero: '/product-images/LF55x80.png' }),
  createOfficialProduct({
    slug: 'recessed-panel', name: 'Recessed Panel', category: 'panels',
    summary: 'Standard recessed LED panel for clean, uniform illumination across commercial interiors.',
    description: 'A low-glare recessed LED panel for T-bar ceiling grids and general commercial illumination, with a flicker-free driver.',
    image: '/product-images/Recessed_Panel.png',
    specs: [{ label: 'Wattage', value: '24W' }, { label: 'Lumens', value: '3,600 lm' }, { label: 'IP Rating', value: 'IP40' }, { label: 'Dimensions', value: '595 x 595mm' }, { label: 'Driver', value: 'Flicker-free' }],
    features: ['Low-glare output', 'Flicker-free driver', 'Edge-to-edge illumination'],
    applications: ['Corporate offices', 'Call centres', 'Schools', 'Retail stores'],
    sheet: 'lumenx-datasheet-recessed-panel.pdf',
  }),
  fromScraped('vapourproof', 'neptune', 'Neptune', 'lumenx-datasheet-neptune.pdf', { hero: '/product-images/neptune.png' }),
  fromScraped('vapourproof', 'titan', 'Titan', 'lumenx-datasheet-titan.pdf', { hero: '/product-images/titan.png' }),
  fromScraped('vapourproof', 'saxa', 'Saxa Triproof', 'lumenx-datasheet-saxa-triproof.pdf', { hero: '/product-images/Saxa_Triproof.png' }),
  createOfficialProduct({
    slug: '35w-track-spot', name: '35W Track Spot', category: 'track',
    summary: 'High-output LED track spot with adjustable beam for accent and display lighting.',
    description: 'A precision 35W LED track spot with adjustable beam options for retail, galleries, showrooms and museum applications.',
    image: '/product-images/35W_Track_Spot.png',
    specs: [{ label: 'Wattage', value: '35W' }, { label: 'Lumens', value: '3,500 lm' }, { label: 'IP Rating', value: 'IP20' }, { label: 'CRI', value: '90+' }, { label: 'Beam Angle', value: '15° / 24° / 38°' }, { label: 'Track', value: '3-circuit compatible' }],
    features: ['Adjustable beam', 'High CRI output', '3-circuit track compatible'],
    applications: ['Art galleries', 'Auto showrooms', 'Fashion retail', 'Museum exhibits'],
    sheet: 'lumenx-datasheet-35w-track-spot.pdf',
  }),
  createOfficialProduct({
    slug: '48w-3-cct-triproof', name: '48W 3 CCT Triproof', category: 'vapourproof',
    summary: '5ft switchable-CCT triproof linear with 3000K, 4000K and 5700K settings.',
    description: 'A 5ft IP65 triproof linear with selectable colour temperature for parking structures, canopies, industrial corridors and loading bays.',
    image: '/product-images/48W_3_CCT_Triproof.png',
    specs: [{ label: 'Wattage', value: '48W' }, { label: 'Lumens', value: '7,200 lm' }, { label: 'IP Rating', value: 'IP65' }, { label: 'CCT', value: '3000K / 4000K / 5700K' }, { label: 'Length', value: '5ft / 1500mm' }],
    features: ['Switchable CCT', 'IP65 protection', 'Polycarbonate housing'],
    applications: ['Parking structures', 'Canopies', 'Industrial corridors', 'Loading bays'],
    sheet: 'lumenx-datasheet-48w-3-cct-triproof.pdf',
  }),
  fromScraped('downlights', 'cob-adjustable-downlight', 'COB Adjustable Downlight', 'lumenx-datasheet-lean-153.pdf', { publicSlug: 'lean-153', hero: '/product-images/lean-153.png' }),
  fromScraped('downlights', 'cob-anti-glare-downlight', 'COB Anti-glare Downlight', 'lumenx-datasheet-cob-dr.pdf', { publicSlug: 'cob-dr', hero: '/product-images/cob-dr.png' }),
  fromScraped('downlights', 'sauron', 'Sauron', 'lumenx-datasheet-sauron.pdf', { hero: '/product-images/sauron.png' }),
  fromScraped('track', 'standard', 'Standard', 'lumenx-datasheet-standard.pdf', { hero: '/product-images/standard.png' }),
  fromScraped('track', 'bazuka', 'Bazuka', 'lumenx-datasheet-bazuka.pdf', { hero: '/product-images/bazuka.png' }),
];