import type { Product, ProductImage } from './types';
import { SCRAPED_PRODUCTS } from './catalogue-scraped';

/**
 * Where a datasheet comes from.
 *
 * Every product renders through the shared HTML/Chromium pipeline, which is the
 * only route that works on the server — the Keynote build needs macOS and
 * Keynote, so it cannot run in production. Payloads are named after the product
 * slug, except for the two below, whose payloads carry the supplier's own stem.
 *
 * `sheet:` on a curated entry is now only the name of its Keynote PDF. Those
 * PDFs are still in the repo; nothing links to them.
 */
const DATASHEET_PAYLOAD: Record<string, string> = {
  'diffused-downlight': 'aegeon', // the Aegeon is the diffused downlight
  lds5083: 'lds-5083',
  cob: 'cob-strip-lumenx', // the COB strip is the LumenX-branded strip payload
  'cloud-bell': 'kinglong-cloud-bell-series', // payload carries the supplier's own stem
  // Both payloads predate their catalogue entry and use a shorter stem: the
  // OrbitX Retrofit LED Module's payload is `retrofit`, and the OrbitX
  // floodlight range's is `flood` — the same file the curated "Performance
  // Floods" entry reads, since both are the same OrbitX floodlight range.
  'retrofit-module': 'retrofit',
  'orbitx-floodlight': 'flood',
};

const datasheetUrl = (slug: string) =>
  `/api/download/datasheet/generated/${DATASHEET_PAYLOAD[slug] ?? slug}`;

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
  brand,
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
  /** Partner brand id. OrbitX fittings display and sort as "OrbitX <name>". */
  brand?: string;
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
  pdfUrl: datasheetUrl(slug),
  ...(brand ? { brand } : {}),
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
/**
 * Scraped products already represented here, keyed `<category>/<slug>`.
 *
 * The rest of the catalogue is published straight from the scrape, so it needs
 * to know which records a curated entry has claimed — otherwise those products
 * appear twice. `fromScraped` records its key as the array below is evaluated,
 * which completes before this module finishes loading.
 */
const consumedScrapedKeys = new Set<string>();

export const CONSUMED_SCRAPED_PRODUCTS: ReadonlySet<string> = consumedScrapedKeys;

const fromScraped = (
  category: string,
  slug: string,
  name: string,
  sheet: string,
  options: {
    publicSlug?: string;
    hero?: string;
    images?: ProductImage[];
    exclude?: string[];
    /**
     * Partner brand id. Usually unnecessary — the generator already stamps
     * `brand` on the OrbitX records — but a curated entry that renames a
     * scraped product has to carry it explicitly, because this spread puts the
     * curated values last.
     */
    brand?: string;
  } = {},
): Product => {
  const product = SCRAPED_PRODUCTS.find((item) => item.category === category && item.slug === slug);
  if (!product) throw new Error(`Missing scraped product: ${category}/${slug}`);
  consumedScrapedKeys.add(`${category}/${slug}`);
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
    pdfUrl: datasheetUrl(options.publicSlug ?? slug),
    imageUrl: hero,
    images,
    ...(options.brand ? { brand: options.brand } : {}),
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
  fromScraped('downlights', 'diffused-downlight', 'Diffused Downlight', 'lumenx-datasheet-aegeon-downlight.pdf', { hero: '/product-images/Aegeon_Downlight.png', exclude: ['/scraped/downlights/diffused-downlight/01-aegeon.webp'] }),
  // The OrbitX Floodlight. The curated entry keeps its published name so the
  // URL does not move; the brand prefix is what makes it read as OrbitX.
  fromScraped('floods', 'flood', 'Performance Floods', 'lumenx-datasheet-performance-floods.pdf', { hero: '/product-images/Performance_Floods.png', brand: 'orbitx' }),
  createOfficialProduct({
    // Filed under Floodlights until the 15 Oct review, where the client's point
    // was simple: "this was a streetlight, so it doesn't go under floodlights."
    slug: '60w-street-light', name: '60W Street Light', category: 'street',
    summary: 'Municipal-grade LED street light with precision roadway optics and zero upward light ratio.',
    description: 'A high-output roadway luminaire with tool-free top opening, precision optics and dark-sky-conscious performance for municipal and access-road projects.',
    image: '/product-images/60W_Street_light.png',
    specs: [{ label: 'Wattage', value: '60W' }, { label: 'Lumens', value: '10,200 lm' }, { label: 'IP Rating', value: 'IP66' }, { label: 'Optics', value: 'Type II / III roadway' }, { label: 'Surge Protection', value: '10kV' }],
    features: ['Precision roadway optics', 'Tool-free top opening', 'Zero upward light ratio'],
    applications: ['Residential streets', 'Urban roads', 'Industrial access', 'Public parks'],
    sheet: 'lumenx-datasheet-60w-street-light.pdf',
  }),
  // The V200 UFO Highbay was deleted outright in the 15 Oct review (Q9): no
  // discontinued flag, the page simply 404s. Its two IES files were removed
  // from the photometry library at the same time.
  fromScraped('highbays', 'thermisto', 'Thermisto', 'lumenx-datasheet-thermisto.pdf', { hero: '/product-images/Thermisto.png', exclude: ['/scraped/highbays/thermisto/01-themisto-lowbay-55-surface-suspension.webp'] }),
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
  fromScraped('downlights', 'cob-anti-glare-downlight', 'COB Anti-glare Downlight', 'lumenx-datasheet-cob-dr.pdf', {
    publicSlug: 'cob-dr',
    hero: '/product-images/cob-dr.png',
    // Gallery is the three size variants only. The hero IS the S-size shot, so the
    // scraped copy of it is redundant; the S/M/L dimension drawings are dropped too
    // because they live on the datasheet this product already links to.
    exclude: [
      '/scraped/downlights/cob-anti-glare-downlight/01-cob-dr-s.png',
      '/scraped/downlights/cob-anti-glare-downlight/02-cob-dr-s-dimensions-1.png',
      '/scraped/downlights/cob-anti-glare-downlight/04-cob-dr-m-dimensions.png',
      '/scraped/downlights/cob-anti-glare-downlight/06-cob-dr-l-dimensions.png',
    ],
  }),
  fromScraped('downlights', 'sauron', 'Sauron', 'lumenx-datasheet-sauron.pdf', { hero: '/product-images/sauron.png', exclude: ['/scraped/downlights/sauron/01-pioled-lighting-hd016-25-20-18-16w-sauron-recessed-round-led-downlight.jpg'] }),
  fromScraped('track', 'standard', 'Standard', 'lumenx-datasheet-standard.pdf', { hero: '/scraped/track/standard/01-standard.webp' }),
  fromScraped('track', 'bazuka', 'Bazuka', 'lumenx-datasheet-bazuka.pdf', { hero: '/product-images/bazuka.png', exclude: ['/scraped/track/bazuka/member-06-pioled-lighting-tkb099d-25w-3-wire-dim-driver.png'] }),

  // ── W8a · the LumenX-branded shots that were sitting unused in
  //    public/product-images. Each of these products was fronting a supplier
  //    photo with the "pioled" logo visible, so the clean asset heads the
  //    gallery and the branded original is dropped from it by `exclude`.

  // Client asked for "a different image". The only supplier file is one
  // composite of three views, and `/product-images/mario.png` was a re-export of
  // that same composite rather than a different photograph, so the page looked
  // unchanged. The hero is now the front-on view cut out of the composite on its
  // own — see scripts/make-derivative-crops.py.
  fromScraped('downlights', 'mario', 'Mario', 'lumenx-datasheet-mario.pdf', {
    hero: '/product-images/mario-front.png',
    exclude: ['/scraped/downlights/mario/01-pioled-lighting-hd020-35w-mario-led-round-tilt-downlight-3cct-1.jpg'],
  }),
  // "Enlarge the fitting in frame" plus "remove the logo". The hero is the
  // supplier's own studio shot of the TKW101 track spot, cropped in and with the
  // "PIOLED LIGHTING" driver label inpainted off the track adapter — see
  // scripts/make-derivative-crops.py.
  //
  // This previously pointed at `/product-images/blaster-crop.png`, a crop of
  // `/product-images/blaster.png`. That file is NOT the Blaster: it is an 18W
  // PioLED magnetic ceiling module (PIO-SRL-18W), so the Blaster product page was
  // fronting a completely unrelated fitting. The mislabelled asset is kept as
  // `/product-images/unidentified-led-ceiling-module-18w.png`.
  fromScraped('track', 'blaster', 'Blaster', 'lumenx-datasheet-blaster.pdf', {
    hero: '/product-images/blaster-track.png',
    exclude: ['/scraped/track/blaster/01-pioled-lighting-tkw101-blaster-high-power-3-wire-track-spot-white-c.png'],
  }),
  // "Use the black one." The shipped leda.png is a three-fitting card, so the
  // black track linear is cropped out of it on its own.
  fromScraped('track', 'leda', 'Leda', 'lumenx-datasheet-leda.pdf', {
    hero: '/product-images/leda-single.png',
    exclude: [
      '/scraped/track/leda/member-01-pioled-lighting-tk005-4ft-leda-3-wire-track-tiltable-linear-3cct-600x6.png',
      '/scraped/track/leda/member-02-pioled-lighting-tk004-3ft-leda-3-wire-track-tiltable-linear-3cct-600x6.png',
      '/scraped/track/leda/member-03-pioled-lighting-tk002-2ft-leda-3-wire-track-tiltable-linear-3cct-white.png',
    ],
  }),
  fromScraped('vapourproof', 'kuda', 'Kuda', 'lumenx-datasheet-kuda.pdf', {
    hero: '/product-images/kuda.png',
    exclude: [
      '/scraped/vapourproof/kuda/member-01-pioled-lighting-ll913-kuda-max-5ft-emergency-kit-space-1.png',
      '/scraped/vapourproof/kuda/member-02-pioled-lighting-ll912-kuda-max-4ft-emergency-kit-space-1.png',
      '/scraped/vapourproof/kuda/member-03-pioled-lighting-ll908-9-kuda-ip65-3cct-linear-batten-white-1.jpg',
      '/scraped/vapourproof/kuda/member-04-pioled-lighting-ll908-9-kuda-ip65-3cct-linear-batten-white-1.jpg',
    ],
  }),
  // Three sizes of the same linear on one card, each with the supplier's logo.
  fromScraped('linears', 'soniq', 'Soniq', 'lumenx-datasheet-soniq.pdf', {
    hero: '/product-images/soniq.png',
    exclude: [
      '/scraped/linears/soniq/member-01-pioled-lighting-ll709-8ft-3-wattage-soniq-seamless-linkable-linear-lig.png',
      '/scraped/linears/soniq/member-02-pioled-lighting-ll707-10w-1ft-soniq-seamless-linkable-linear-light-3cc.png',
      '/scraped/linears/soniq/member-03-pioled-lighting-ll705-4ft-soniq-seamless-linkable-linear-light-3cct-bl.png',
    ],
  }),
  // Client: "the LEDs are blued out — use the COB image." The payload keeps the
  // supplier's own stem, hence the DATASHEET_PAYLOAD entry above.
  fromScraped('strips', 'cob', 'COB Strip', 'lumenx-datasheet-cob-strip-lumenx.pdf', {
    hero: '/product-images/COB_STRIP.png',
    exclude: ['/scraped/strips/cob/01-pioled-lighting-s303-sr303-a-10w-24v-cob-ip20-strip-3000k-1.jpg'],
  }),
  // Q8: "choose the most suitable" of the twelve. 06-cloudbell-s4 is the only
  // candidate that still reads as the product at tile scale: its own alpha
  // cut-out, every element in frame, none of them overlapping each other. The 03
  // hero it replaces is a thin, half-transparent S1 strand.
  //
  // The category id is `architectural-indoor`: W5 merged Indoor Architectural
  // and Decorative into that one category, and this record's category moved with
  // it. The ASSET path is still /scraped/decorative/cloud-bell — that directory
  // has not moved, so the hero and the exclude point at where the files are.
  fromScraped('architectural-indoor', 'cloud-bell', 'Cloud Bell', 'lumenx-datasheet-kinglong-cloud-bell-series.pdf', {
    hero: '/scraped/decorative/cloud-bell/06-cloudbell-s4-l1496-w1303-h982.webp',
    exclude: ['/scraped/decorative/cloud-bell/03-cloudbell-s1-l2127-w1116-h1403.webp'],
  }),

  /* ── OrbitX lines added in the 15 Oct review (W6c, W6d) ─────────────────────
   *
   * Three OrbitX fittings were missing from the catalogue although their
   * datasheet payloads and IES photometry were already built, and the client
   * also wanted the floodlight range listed.
   *
   * Every value below comes from `specsheets-manual/OrbitX/*.pdf` — the
   * authoritative source — not from a re-scrape. The payload slugs match the
   * filenames already in `server/datasheets-data/`, and the IES filenames match
   * the photometry already in `server/files/ies/`.
   */
  createOfficialProduct({
    slug: 'jupiter', name: 'Jupiter 1200mm', category: 'highbays', brand: 'orbitx',
    summary: 'Direct Drive 1200mm highbay linear delivering up to 25,000 lumens, backed by an 8-year operational guarantee.',
    description:
      'The OrbitX Jupiter is a 1200mm integrated IP65 linear highbay built on OrbitX Direct Drive technology. Thirteen power ratings from 20W to 200W cover everything from aisle lighting to tall-rack warehousing, and the polycarbonate extrusion carries no glass. Backed by an 8-year operational guarantee.',
    // Stand-in: the vendor's Neptune photo. There is no Jupiter photograph in
    // the repo yet, and a wrong-but-plausible shot beats a broken card — but it
    // must be swapped before launch (see the OrbitX image gaps in the report).
    image: '/product-images/orbitx-jupiter.png',
    specs: [
      { label: 'Operational Guarantee (365d × 24h)', value: '8 years' },
      { label: 'Light Output Guarantee (365d × 24h)', value: '5 years' },
      { label: 'Wattage', value: '20W – 200W (13 ratings: 20/40/60/80/100/112/120/128/140/150/160/180/200 W)' },
      { label: 'Lumens', value: '2,500 – 25,000 lm' },
      { label: 'Luminous Efficacy', value: '135 lm/W' },
      { label: 'IP Rating', value: 'IP65' },
      { label: 'Nominal Lifetime (L70)', value: '70 000 hours (IES LM-80, TM-21)' },
      { label: 'Colour Temperature', value: '5000K (options available)' },
      { label: 'CRI', value: '83' },
      { label: 'Beam Angle', value: '120°' },
      { label: 'Operating Voltage', value: '220–240V AC' },
      { label: 'Power Factor', value: '>0.98' },
      { label: 'Flicker', value: '80% flicker free at 100Hz (OHS and MHS Act compliant)' },
      { label: 'Surge Protection', value: '1.5kV' },
      { label: 'Fire Rating', value: 'UL-94 V0 compliant (no flaming droplets)' },
      { label: 'Housing', value: 'Polycarbonate extrusion, 1mm, no glass' },
      { label: 'T Ambient', value: '+35°C max / −40°C min' },
      { label: 'Electrical Safety', value: 'IEC60598-1, IEC60598-2-5 compliant' },
      { label: 'Dimensions', value: '1200 × 140 × 66mm' },
      { label: 'Optional Battery Backup', value: '1000 lm for 4h, 6h charge time' },
    ],
    features: [
      'OrbitX Direct Drive technology onboard',
      '8-year operational guarantee',
      '135 lm/W efficacy',
      'IP65 polycarbonate housing — no glass',
      'Optional battery backup and variable switching',
    ],
    applications: ['Warehouses', 'Manufacturing plants', 'Logistics aisles', 'High-ceiling industrial'],
    sheet: 'lumenx-datasheet-jupiter.pdf',
  }),
  createOfficialProduct({
    slug: 'puck-panel', name: 'Puck Panel 1200mm', category: 'panels', brand: 'orbitx',
    summary: 'OrbitX 1200 × 600mm panel replacement delivering 6,000 lumens at 100 lm/W, with a 6-year operational guarantee.',
    description:
      'The OrbitX Puck Panel is a direct replacement for a 1200 × 600mm panel light, built on OrbitX Direct Drive technology. A 160° beam and Type A light quality make it suitable for offices and professional interiors, and it is available in black or white.',
    image: '/product-images/orbitx-puck-panel.png',
    specs: [
      { label: 'Operational Guarantee (365d × 24h)', value: '6 years' },
      { label: 'Light Output Guarantee (365d × 24h)', value: '3 years' },
      { label: 'Wattage', value: '58W (1200 × 600mm) · 38W (600 × 600mm)' },
      { label: 'Lumens', value: '6,000 lm (1200 × 600mm) · 4,000 lm (600 × 600mm)' },
      { label: 'Luminous Efficacy', value: '100 lm/W' },
      { label: 'Nominal Lifetime (L70)', value: '60 000 hours (IES LM-80, TM-21)' },
      { label: 'Colour Temperature', value: '5000K (4000K available)' },
      { label: 'CRI', value: '83' },
      { label: 'Beam Angle', value: '160°' },
      { label: 'Operating Voltage', value: '220–240V AC' },
      { label: 'Power Factor', value: '>0.98' },
      { label: 'Flicker', value: '80% flicker free at 100Hz (OHS and MHS Act compliant)' },
      { label: 'Surge Protection', value: '1.5kV' },
      { label: 'Fire Rating', value: 'UL-94 V0 compliant (no flaming droplets)' },
      { label: 'Housing', value: 'Polycarbonate extrusion, 1mm, no glass' },
      { label: 'Finish', value: 'Black or white' },
      { label: 'T Ambient', value: '+30°C max / −40°C min' },
      { label: 'Electrical Safety', value: 'IEC60598-1, IEC60598-2-5 compliant' },
      { label: 'Dimensions', value: '1200 × 600 × 39mm' },
    ],
    features: [
      'Direct replacement for a 1200 × 600 panel light',
      'OrbitX Direct Drive technology onboard',
      '6-year operational guarantee',
      'Available in black or white',
      '160° beam with Type A light quality',
    ],
    applications: ['Offices', 'Boardrooms', 'Education', 'Professional interiors'],
    sheet: 'lumenx-datasheet-puck-panel.pdf',
  }),
  createOfficialProduct({
    slug: 'retrofit-module', name: 'Retrofit Module 15W', category: 'bulkheads', brand: 'orbitx',
    summary: '15W OrbitX retrofit LED module that converts an existing fitting to Direct Drive LED, with a 6-year operational guarantee.',
    description:
      'The OrbitX Retrofit LED Module replaces the lamp in an existing luminaire with a 15W, 2,000 lumen Direct Drive LED engine. It runs from 220V AC, carries an integrated surge arrestor and must be earthed. Optional radar motion and day/night sensors are available.',
    // Stand-in: the vendor's Rhea bulkhead photo, same IP65 Direct Drive range.
    // There is no retrofit-module photograph in the repo yet.
    image: '/product-images/orbitx-retrofit-module.png',
    specs: [
      { label: 'Operational Guarantee (365d × 24h)', value: '6 years' },
      { label: 'Light Output Guarantee (365d × 24h)', value: '3 years' },
      { label: 'Wattage', value: '15W' },
      { label: 'Lumens', value: '2,000 lm' },
      { label: 'Luminous Efficacy', value: '120 lm/W' },
      { label: 'IP Rating', value: 'IP65' },
      { label: 'Nominal Lifetime (L70)', value: '70 000 hours (IES LM-80, TM-21)' },
      { label: 'Colour Temperature', value: '5000K (4000K and other options available)' },
      { label: 'CRI', value: '83' },
      { label: 'Beam Angle', value: '160°' },
      { label: 'Operating Voltage', value: '220–240V AC' },
      { label: 'Power Factor', value: '>0.98' },
      { label: 'Surge Protection', value: '1.5kV integrated surge arrestor' },
      { label: 'Earthing', value: 'Must be earthed' },
      { label: 'Fire Rating', value: 'UL-94 V2 compliant' },
      { label: 'T Ambient', value: '+30°C max / −40°C min' },
      { label: 'Dimensions', value: '⌀ 205mm, 10mm max height at surge arrestor' },
      { label: 'Optional Radar Motion Sensor', value: 'Programmable sensitivity and time on' },
      { label: 'Optional Day/Night Sensor', value: 'Switches on at dusk, off at dawn' },
    ],
    features: [
      'Retrofits an existing luminaire to Direct Drive LED',
      '6-year operational guarantee',
      'Integrated surge arrestor',
      'Optional radar motion and day/night sensors',
      'Optional battery backup',
    ],
    applications: ['Bulkhead retrofits', 'Stairwells', 'Corridors', 'Parking areas'],
    sheet: 'lumenx-datasheet-retrofit.pdf',
  }),
  createOfficialProduct({
    slug: 'orbitx-floodlight', name: 'Floodlight', category: 'floods', brand: 'orbitx',
    summary: 'IP66 OrbitX floodlight with an integrated day/night sensor, from 20W / 2,600 lm to 300W / 41,100 lm.',
    description:
      'The OrbitX Floodlight is an IP66 area luminaire with an integrated automatic day/night sensor, designed for African conditions. Five configurations run from 20W to 300W, each with a 120° beam and a −40°C to +40°C ambient range. Backed by a 6-year operational guarantee.',
    image: '/product-images/orbitx-floodlight.png',
    specs: [
      { label: 'Operational Guarantee (365d × 24h)', value: '6 years' },
      { label: 'Light Output Guarantee (365d × 24h)', value: '3 years' },
      { label: 'Wattage', value: '20W / 35W / 70W / 150W / 300W' },
      { label: 'Lumens', value: '2,600 lm / 4,500 lm / 9,800 lm / 18,900 lm / 41,100 lm' },
      { label: 'Luminous Efficacy', value: '125 lm/W' },
      { label: 'IP Rating', value: 'IP66' },
      { label: 'Nominal Lifetime (L70)', value: '60 000 hours — over 10 years at 12h per day (IES LM-80, TM-21)' },
      { label: 'Colour Temperature', value: '5000K (options available)' },
      { label: 'CRI', value: '83' },
      { label: 'Beam Angle', value: '120°' },
      { label: 'Operating Voltage', value: '220–240V AC' },
      { label: 'Power Factor', value: '>0.98' },
      { label: 'Sensor', value: 'Integrated automatic day/night sensor' },
      { label: 'T Ambient', value: '+40°C max / −40°C min' },
      { label: 'Dimensions (20W / 35W)', value: '190 × 122 × 37mm' },
      { label: 'Dimensions (70W)', value: '240 × 200 × 45mm' },
      { label: 'Dimensions (150W)', value: '346 × 312 × 54mm' },
      { label: 'Dimensions (300W)', value: '380 × 350 × 71mm' },
    ],
    features: [
      'Integrated automatic day/night sensor',
      'IP66 for exterior mounting',
      'Designed for Africa — −40°C to +40°C',
      '6-year operational guarantee',
      'Five configurations from 20W to 300W',
    ],
    applications: ['Yards', 'Perimeters', 'Security lighting', 'Area and facade lighting'],
    sheet: 'lumenx-datasheet-orbitx-floodlight.pdf',
  }),
];