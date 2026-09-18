import type { Product, ProductImage } from './types';
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

/**
 * Build one catalogue entry from its scraped record.
 *
 * `hero` replaces the scraped lead image and always heads the gallery. The scraped
 * list is then appended, minus the hero itself.
 *
 * `exclude` drops further scraped entries by src. It exists because a scraped `01-*`
 * image is frequently the SAME picture as the curated `/product-images/` hero —
 * sometimes byte-identical, sometimes the same shot re-saved opaque instead of as a
 * transparent cutout — so comparing src alone is not enough to spot the repeat. List
 * those duplicates here; otherwise the product page shows one photo twice.
 */
const fromScraped = (
  category: string,
  slug: string,
  name: string,
  sheet: string,
  options: { publicSlug?: string; hero?: string; images?: ProductImage[]; exclude?: string[] } = {},
): Product => {
  const product = SCRAPED_PRODUCTS.find((item) => item.category === category && item.slug === slug);
  if (!product) throw new Error(`Missing scraped product: ${category}/${slug}`);
  const hero = options.hero ?? product.imageUrl;
  const skip = new Set([hero, ...(options.exclude ?? [])]);
  const images = options.images ?? [
    { src: hero, fit: 'contain', alt: name },
    ...(product.images ?? []).filter((image) => !skip.has(image.src)),
  ];
  return {
    ...product,
    slug: options.publicSlug ?? slug,
    name,
    pdfUrl: officialSheet(sheet),
    imageUrl: hero,
    images,
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
  fromScraped('downlights', 'diffused-downlight', 'Diffused Downlight', 'lumenx-datasheet-aegeon-downlight.pdf', { hero: '/product-images/Aegeon_Downlight.png', exclude: ['/scraped/downlights/diffused-downlight/01-aegeon.jpg'] }),
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
  fromScraped('highbays', 'thermisto', 'Thermisto', 'lumenx-datasheet-thermisto.pdf', { hero: '/product-images/Thermisto.png', exclude: ['/scraped/highbays/thermisto/01-themisto-lowbay-55-surface-suspension.jpg'] }),
  createOfficialProduct({
    slug: '600x1200-recessed-panel', name: '600x1200 Recessed Panel', category: 'panels',
    summary: 'Wide-format recessed LED panel for modern architectural ceiling layouts.',
    description: 'A 600x1200mm back-lit recessed LED panel delivering uniform, low-glare illumination for elongated architectural ceiling layouts. UGR <19 and flicker-free.',
    image: '/product-images/600x1200_Recessed_Panel.png',
    specs: [{ label: 'Wattage', value: '50W' }, { label: 'Lumens', value: '6,500 lm' }, { label: 'IP Rating', value: 'IP20' }, { label: 'Dimensions', value: '595 x 1195 x 30mm' }, { label: 'UGR', value: '<19' }, { label: 'CRI', value: '>80' }, { label: 'Beam Angle', value: '120°' }, { label: 'Driver', value: 'Flicker-free' }],
    features: ['Uniform edge-to-edge illumination', 'Flicker-free driver', 'Architectural 600x1200 format'],
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
  fromScraped('linears', 'puck-seamless', 'Puck Seamless', 'lumenx-datasheet-puck-seamless.pdf', { hero: '/product-images/puck-seamless.png', exclude: ['/scraped/linears/puck-seamless/01-puck-800x601.png'] }),
  fromScraped('linears', 'puck-profile-40x43', 'Puck Profile 40x43', 'lumenx-datasheet-puck-profile-40x43.pdf', { hero: '/product-images/orbitx-puck-40x43.png' }),
  fromScraped('linears', 'puck-profile-70x36', 'Puck Profile 70x36', 'lumenx-datasheet-puck-profile-70x36.pdf', { hero: '/product-images/orbitx-puck-70x36.png' }),
  fromScraped('linears', 'lds5083', 'Linear 50x83mm', 'lumenx-datasheet-linear-50x83mm.pdf', { hero: '/product-images/Linear_50x83mm.png' }),
  fromScraped('linears', 'lf55', 'LF55x80', 'lumenx-datasheet-lf55x80.pdf', { hero: '/product-images/LF55x80.png' }),
  createOfficialProduct({
    slug: 'recessed-panel', name: 'Recessed Panel', category: 'panels',
    summary: 'Standard 600x600 recessed LED panel for clean, uniform illumination across commercial interiors.',
    description: 'A 600x600mm back-lit recessed LED panel for T-bar ceiling grids and general commercial illumination, with low-glare UGR <19 optics and a flicker-free driver.',
    image: '/product-images/Recessed_Panel.png',
    specs: [{ label: 'Wattage', value: '30W' }, { label: 'Lumens', value: '3,900 lm' }, { label: 'IP Rating', value: 'IP20' }, { label: 'Dimensions', value: '595 x 595 x 30mm' }, { label: 'UGR', value: '<19' }, { label: 'CRI', value: '>80' }, { label: 'Beam Angle', value: '120°' }, { label: 'Driver', value: 'Flicker-free' }],
    features: ['Low-glare output', 'Flicker-free driver', 'Edge-to-edge illumination'],
    applications: ['Corporate offices', 'Call centres', 'Schools', 'Retail stores'],
    sheet: 'lumenx-datasheet-recessed-panel.pdf',
  }),
  fromScraped('vapourproof', 'neptune', 'Neptune', 'lumenx-datasheet-neptune.pdf', { hero: '/product-images/neptune.png', exclude: ['/scraped/vapourproof/neptune/01-neptune-800x416.png'] }),
  fromScraped('vapourproof', 'titan', 'Titan', 'lumenx-datasheet-titan.pdf', { hero: '/product-images/titan.png', exclude: ['/scraped/vapourproof/titan/01-titan-800x418.png'] }),
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
  fromScraped('downlights', 'cob-adjustable-downlight', 'COB Adjustable Downlight', 'lumenx-datasheet-lean-153.pdf', {
    publicSlug: 'lean-153',
    hero: '/product-images/lean-153.png',
    images: [{ src: '/product-images/lean-153.png', fit: 'contain', alt: 'COB Adjustable Downlight' }],
  }),
  fromScraped('downlights', 'cob-anti-glare-downlight', 'COB Anti-glare Downlight', 'lumenx-datasheet-cob-dr.pdf', { publicSlug: 'cob-dr', hero: '/product-images/cob-dr.png' }),
  fromScraped('downlights', 'sauron', 'Sauron', 'lumenx-datasheet-sauron.pdf', { hero: '/product-images/sauron.png', exclude: ['/scraped/downlights/sauron/01-pioled-lighting-hd016-25-20-18-16w-sauron-recessed-round-led-downlight.jpg'] }),
  fromScraped('track', 'standard', 'Standard', 'lumenx-datasheet-standard.pdf', { hero: '/scraped/track/standard/01-standard.jpg' }),
  fromScraped('track', 'bazuka', 'Bazuka', 'lumenx-datasheet-bazuka.pdf', { hero: '/product-images/bazuka.png', exclude: ['/scraped/track/bazuka/member-06-pioled-lighting-tkb099d-25w-3-wire-dim-driver.png'] }),
];