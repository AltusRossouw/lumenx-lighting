#!/usr/bin/env python3
"""Generate the LumenX site product catalogue from the scraped data.

Reads data-scrape/products/**/{product.json,README.md,images/}, copies the
supplier photos into public/scraped/<category>/<slug>/, copies datasheet PDFs
into public/datasheets/<slug>.pdf, and emits src/catalogue-scraped.ts with a
SCRAPED_CATEGORIES (ProductCategory[]) and SCRAPED_PRODUCTS (Product[]) array in
the exact shape the LumenX site expects.

Run from the repo root:  python3 data-scrape/generate_catalogue.py
"""
import json
import os
import re
import shutil
import sys
import unicodedata
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PRODUCTS_ROOT = os.path.join(HERE, 'products')
PUBLIC = os.path.join(ROOT, 'public')
SCRAPED_IMG = os.path.join(PUBLIC, 'scraped')
DATASHEETS = os.path.join(PUBLIC, 'datasheets')
INDEX_JSON = os.path.join(HERE, 'product-images.json')
OUT_TS = os.path.join(ROOT, 'src', 'catalogue-scraped.ts')

# ─────────────────────────────────────────────────────────────────────────
# Category mapping: scrape category name -> site category id + metadata.
# ─────────────────────────────────────────────────────────────────────────
CATEGORY_MAP = {
    'Bulkheads': ('bulkheads', {
        'title': 'Bulkheads',
        'description': 'Robust wall and ceiling luminaires for corridors, stairwells, entrances and wet areas. Impact-resistant housings with IP ratings for indoor and outdoor use.',
        'applications': 'Corridors, stairwells, entrances, plant rooms and exterior walkways',
        'linkLabel': 'Explore Bulkheads',
    }),
    'Downlights': ('downlights', {
        'title': 'Downlights',
        'description': 'Recessed and surface downlights delivering precise, comfortable illumination — from trimless architectural details to high-output commercial fittings.',
        'applications': 'Offices, retail, hospitality, healthcare and residential interiors',
        'linkLabel': 'Explore Downlights',
    }),
    'Floods': ('floods', {
        'title': 'Floodlights',
        'description': 'High-output exterior luminaires for area lighting, security, facades and perimeters with asymmetric and symmetric beam options.',
        'applications': 'Facades, sports facilities, yards, perimeters and area lighting',
        'linkLabel': 'Explore Floodlights',
    }),
    'Highbays': ('highbays', {
        'title': 'Highbays',
        'description': 'High-output luminaires engineered for high ceilings, racking aisles and demanding industrial environments with industry-leading guarantees.',
        'applications': 'Warehouses, factories, logistics and manufacturing facilities',
        'linkLabel': 'Explore Highbays',
    }),
    'Linears': ('linears', {
        'title': 'Linear Lighting',
        'description': 'Continuous, seamless and profile linear systems for architectural, retail and workspace environments — surface, suspended or recessed.',
        'applications': 'Offices, retail, education and architectural interiors',
        'linkLabel': 'Explore Linear Lighting',
    }),
    'Panels': ('panels', {
        'title': 'Panels',
        'description': 'Low-glare, flicker-free LED panels for clean general illumination across offices, education and healthcare environments.',
        'applications': 'Offices, education, healthcare and corporate interiors',
        'linkLabel': 'Explore Panels',
    }),
    'Strips': ('strips', {
        'title': 'LED Strips',
        'description': 'Flexible and COB dotless strip lighting for seamless cove, display, under-cabinet and joinery accent illumination.',
        'applications': 'Cove lighting, display shelving, signage and joinery accent',
        'linkLabel': 'Explore LED Strips',
    }),
    'Track': ('track', {
        'title': 'Track Lighting',
        'description': 'Adjustable track spots and linear track fittings for retail, gallery and display applications with precise aiming control.',
        'applications': 'Retail, galleries, showrooms and hospitality displays',
        'linkLabel': 'Explore Track Lighting',
    }),
    'Vapour proof': ('vapourproof', {
        'title': 'Vapour Proof',
        'description': 'Sealed IP65/IP66 luminaires resistant to dust, moisture and vapour for demanding industrial, parking and washdown environments.',
        'applications': 'Parking structures, food processing, warehousing and washdown areas',
        'linkLabel': 'Explore Vapour Proof Lighting',
    }),
    'Indoor Architectural': ('indoor-architectural', {
        'title': 'Architectural — Indoor',
        'description': 'Recessed, surface and suspended architectural luminaires for refined interior detailing — circular systems, pendants and ceiling lights.',
        'applications': 'Offices, hospitality, retail and residential architecture',
        'linkLabel': 'Explore Architectural — Indoor',
    }),
    'Indoor Decorative': ('decorative', {
        'title': 'Decorative',
        'description': 'Statement chandeliers and decorative series that make interiors feel curated — layered acrylic, crystal and sculptural forms.',
        'applications': 'Hotels, restaurants, residences and feature interiors',
        'linkLabel': 'Explore Decorative',
    }),
    'Outdoor Architectural': ('outdoor-architectural', {
        'title': 'Architectural — Outdoor',
        'description': 'Outdoor spots, bollards, post-tops, wall lights and in-ground luminaires for considered exterior architecture and landscape.',
        'applications': 'Facades, gardens, pathways, plazas and streetscapes',
        'linkLabel': 'Explore Architectural — Outdoor',
    }),
    'Sensors': ('sensors', {
        'title': 'Sensors',
        'description': 'Motion and presence detectors for indoor and outdoor automation — PIR, HF and ultrasonic with adjustable detection zones.',
        'applications': 'Offices, warehouses, corridors, parking and security',
        'linkLabel': 'Explore Sensors',
    }),
    'Solar': ('solar', {
        'title': 'Solar',
        'description': 'All-in-one solar post-top and area lighting for sites with no grid — self-sustaining with integrated panels and batteries.',
        'applications': 'Estates, parks, isolated streets and gate posts',
        'linkLabel': 'Explore Solar',
    }),
    'Profiles': ('profiles', {
        'title': 'Profiles & Accessories',
        'description': 'Extrusion profiles and system accessories for integrating LED tape into architecture and millwork.',
        'applications': 'Coves, joinery, display and linear detailing',
        'linkLabel': 'Explore Profiles & Accessories',
    }),
}

# Special-case: Strips/02-lby-profiles is actually profiles/accessories.
FOLDER_CATEGORY_OVERRIDE = {
    'Strips/02-lby-profiles': 'Profiles',
}

# ─────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────
def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return re.sub(r'-+', '-', text)


# Rank real product photos above technical dimension/diagram drawings so a
# genuine render is always chosen as the hero image. 'banner/teaser' shots are
# also demoted (they're marketing headers, not the fixture).
IMAGE_TYPE_RANK = {
    'hero': 0,
    'product': 1,
    'detail': 2,
    'application': 3,
    'case study': 4,
    'banner/teaser': 5,
    'diagram/drawing': 6,
}
_IMAGE_TYPE_LOADED = None


def load_image_type_index():
    """Return {(folder_path, filename): type} from data-scrape/product-images.json.

    Folder paths use the index convention ('products/<Category>/<NN-name>').
    """
    global _IMAGE_TYPE_LOADED
    if _IMAGE_TYPE_LOADED is not None:
        return _IMAGE_TYPE_LOADED
    lookup = {}
    if os.path.exists(INDEX_JSON):
        try:
            data = json.load(open(INDEX_JSON, encoding='utf-8'))
            for item in data.get('images', []):
                path = item.get('path', '')
                folder = path.split('/images/')[0]
                lookup[(folder, item.get('file'))] = item.get('type')
        except Exception:
            lookup = {}
    _IMAGE_TYPE_LOADED = lookup
    return lookup


def image_type_rank(folder_rel, fname, kind):
    """Rank for ordering a product's images (lower sorts first).

    Falls back to the 'kind' field when the index has no entry. Overrides the
    scrape's unreliable 'diagram/drawing' type when the filename clearly
    indicates a real product photo (many Pioled member photos were mis-typed).
    """
    lookup = load_image_type_index()
    t = lookup.get((folder_rel, fname))
    # True diagrams are named dimensions/schaltplan/driver/drawing. A
    # 'diagram/drawing' type on a normal product filename is a misclass.
    looks_diagram = bool(re.search(r'\b(dimension|schaltplan|drawing|spec|diagram|datasheet|driver)\b', fname.lower()))
    if t == 'diagram/drawing' and not looks_diagram:
        t = 'product'
    if t:
        return IMAGE_TYPE_RANK.get(t, 5)
    # Heuristic fallback: filename contains dimension/drawing words.
    if looks_diagram:
        return 6
    if kind in ('doc',):
        return 6
    return 5


# ── Datasheet payloads (server/datasheets-data/<slug>.json) ──
# These are the hand-curated spec source for every product, used to backfill
# products whose scrape produced no structured spec table.
DASH_DATA_DIR = os.path.join(ROOT, 'server', 'datasheets-data')
_DATASHEET_BY_NAME = None


def norm_key(s):
    return re.sub(r'[^a-z0-9]+', '', str(s or '').lower())


def load_datasheet_index():
    """Return {normalized_name: datasheet_payload} across datasheets-data.

    Also includes an alias by the file slug so we can look up directly.
    """
    global _DATASHEET_BY_NAME
    if _DATASHEET_BY_NAME is not None:
        return _DATASHEET_BY_NAME
    idx = {}
    if os.path.isdir(DASH_DATA_DIR):
        for f in sorted(os.listdir(DASH_DATA_DIR)):
            if not f.endswith('.json'):
                continue
            try:
                d = json.load(open(os.path.join(DASH_DATA_DIR, f), encoding='utf-8'))
            except Exception:
                continue
            name = norm_key(d.get('name'))
            if name:
                idx.setdefault(name, d)
            idx.setdefault(norm_key(f[:-5]), d)
    _DATASHEET_BY_NAME = idx
    return idx


def datasheet_for(name):
    """Return the datasheet payload for a product name, or None."""
    return load_datasheet_index().get(norm_key(name))


# Aggregated specs for Pioled collection products (scraped from each member
# product page by tools/scrape-collections.mjs → collection-specs.json).
COLLECTION_SPECS_FILE = os.path.join(HERE, 'collection-specs.json')
_COLLECTION_SPECS_LOADED = None


def load_collection_specs():
    global _COLLECTION_SPECS_LOADED
    if _COLLECTION_SPECS_LOADED is not None:
        return _COLLECTION_SPECS_LOADED
    data = {}
    if os.path.exists(COLLECTION_SPECS_FILE):
        try:
            data = json.load(open(COLLECTION_SPECS_FILE, encoding='utf-8'))
        except Exception:
            data = {}
    _COLLECTION_SPECS_LOADED = data
    return data


# ── Generated datasheet payloads (server/datasheets-data/<slug>.json) ──
# Every product gets a datasheet JSON rendered to PDF by the datasheet-pdf
# service when the user clicks "Spec Sheet". We generate these from the current
# (rebranded, spec-enriched) catalogue data so the PDF matches the site.

DASH_OUT_DIR = os.path.join(ROOT, 'server', 'datasheets-data')

# LumenX-renamed product slug -> datasheet-data slug (legacy hand-curated files
# are keyed by the old/supplier slug).
DATASHEET_SLUG_ALIASES = {
    'diffused-downlight': 'aegeon',
    'cob-adjustable-downlight': 'lean-153',
    'cob-anti-glare-downlight': 'cob-dr',
    'small-cob-anti-glare-downlight': 'x-tf8',
    'cob-square-downlight': 'cob-r-sq1',
    'cob-square-double-downlight': 'cob-r-sq2',
    'cob-square-triple-downlight': 'cob-r-sq3',
    'gu10-downlight': 'gu10',
    'surface-adjustable-downlight': 'pakman',
    'pearl': 'kinglong-pearl-series',
    'fuji-square': 'fuji-bollard-square',
    'fuji-round': 'fuji-bollard-round',
    'everest-square': 'everest-bollard-square',
    'everest-round': 'everest-bollard-round',
    'orbit': 'orbit-post-top',
    'vista': 'vista-post-top',
    'dual-hf-corridoor': 'steinel-dual-hf-corridor',
}


def load_datasheet_name_to_slug():
    """Return {normalized_name: slug} for all datasheets-data JSON files."""
    mapping = {}
    if os.path.isdir(DASH_DATA_DIR):
        for f in sorted(os.listdir(DASH_DATA_DIR)):
            if not f.endswith('.json'):
                continue
            try:
                d = json.load(open(os.path.join(DASH_DATA_DIR, f), encoding='utf-8'))
            except Exception:
                continue
            mapping.setdefault(norm_key(d.get('name')), f[:-5])
    return mapping


def datasheet_slug_for(name, product_slug):
    """Resolve the datasheet-data slug for a product (by alias, then name)."""
    if product_slug in DATASHEET_SLUG_ALIASES:
        return DATASHEET_SLUG_ALIASES[product_slug]
    slug = load_datasheet_name_to_slug().get(norm_key(name))
    return slug or slugify(name) or product_slug


# Spec-label → datasheet column grouping.
PHYSICAL_LABELS = re.compile(
    r'^(housing|mounting|mounting type|colour|color|finish|material|type|dimensions?|'
    r'product size|size|trim|adjustab|tilt|beam|optic|profile|length|width|height)', re.I)
ELECTRICAL_LABELS = re.compile(
    r'^(wattage|power|voltage|input voltage|power factor|dimming|dimmable|control|'
    r'surge|driver|battery|charging)', re.I)
COMPLIANCE_LABELS = re.compile(
    r'^(certification|certif|warranty|guarantee|compliance|safety|fire rating|'
    r'lifetime|life span|lifespan|operating temp|operating temperature|ip rating|'
    r'ik rating|rohs|ce|emc|erp|ies)', re.I)

# Headline stats (top 3) — prefer these labels, in order.
STAT_LABELS = ['Power', 'Wattage', 'Lumens', 'Lumen Output', 'Efficacy',
               'IP Rating', 'Colour Temperature', 'CCT', 'Beam Angle', 'CRI']


def split_spec_units(value):
    """Split a spec value into (number, unit) where sensible, e.g. '35W' -> ('35','W')."""
    v = clean_text(value or '')
    m = re.match(r'^([\d.,\s–\-~]+)\s*([a-zA-Z°%]+)$', v)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return v, ''


def build_datasheet_payload(product):
    """Build a datasheet JSON payload for a product from its catalogue record."""
    specs = product.get('specs') or []
    name = product['name']

    # Headline stats (up to 3, preferred labels, unit-split).
    stats = []
    seen_stat = set()
    for want in STAT_LABELS:
        for s in specs:
            if s['label'].lower() == want.lower() and want.lower() not in seen_stat:
                num, unit = split_spec_units(s['value'])
                stats.append({'label': want, 'value': num, 'unit': unit})
                seen_stat.add(want.lower())
                break
        if len(stats) >= 3:
            break
    if len(stats) < 3:
        for s in specs:
            lab = s['label'].lower()
            if lab in seen_stat:
                continue
            num, unit = split_spec_units(s['value'])
            stats.append({'label': s['label'], 'value': num, 'unit': unit})
            seen_stat.add(lab)
            if len(stats) >= 3:
                break

    # Group the remaining specs into columns.
    physical = []
    electrical = []
    compliance = []
    info = []
    for s in specs:
        lab = s['label']
        if PHYSICAL_LABELS.match(lab):
            physical.append({'label': lab, 'value': s['value']})
        elif ELECTRICAL_LABELS.match(lab):
            electrical.append({'label': lab, 'value': s['value']})
        elif COMPLIANCE_LABELS.match(lab):
            compliance.append({'label': lab, 'value': s['value']})
        else:
            info.append({'label': lab, 'value': s['value']})

    left = []
    if physical:
        left.append({'title': 'Physical', 'rows': physical[:14]})
    if compliance:
        left.append({'title': 'Compliance', 'rows': compliance[:14]})
    right = []
    if info:
        right.append({'title': 'Product Information', 'rows': info[:20]})
    if electrical:
        right.append({'title': 'Electrical', 'rows': electrical[:14]})

    hero_src = product['imageUrl']
    # heroImage src uses ../public/… convention relative to the template.
    hero_rel = hero_src
    if hero_src.startswith('/scraped/'):
        hero_rel = '../public' + hero_src
    elif hero_src.startswith('/product-images/'):
        hero_rel = '../public' + hero_src
    else:
        hero_rel = '../public' + hero_src

    # Summary (first sentence) doubles as the variant line.
    variant = product.get('summary') or ''
    variant = re.split(r'(?<=[.!?])\s', variant)[0].strip().rstrip('.')

    return {
        'fileStem': name,
        'meta': {'rev': '1.0'},
        'name': name.upper(),
        'category': product['category'].replace('-', ' ').upper(),
        'variant': variant,
        'stats': stats,
        'heroImage': {'src': hero_rel, 'alt': name},
        'overview': [product.get('description') or variant],
        'features': product.get('features') or [],
        'applications': product.get('applications') or [],
        'columns': {'left': left, 'right': right},
        'drawing': {'src': '', 'alt': 'Dimension drawing'},
        'notes': [
            'E &amp; O.E (Errors And Omissions Excepted).',
            'Due to the rapid development in LED technology the performance values, power consumption and lumen output levels stated above are subject to change without prior notice.',
            'Due to the interoperability of LED modules and drivers, up to a 10% deviation in these values is possible.',
            'Nominal flux values are stated at 25° C, based on LED manufacturer\u2019s data.',
            'Installation environmental conditions may impact the performance and efficiency of the luminaire.',
        ],
        'contact': {
            'web': 'www.lumenx.co.za',
            'email': 'info@lumenx.co.za',
            'phone': '+27 83 499 5340',
        },
    }


def flatten_datasheet_specs(ds):
    """Flatten a datasheet's stats + columns.*.rows into [{label, value}]."""
    rows = []
    seen = set()
    for s in ds.get('stats', []) or []:
        label = (s.get('label') or '').strip()
        value = (s.get('value') or '').strip()
        unit = (s.get('unit') or '').strip()
        if label and value:
            if unit and not re.search(r'\d\s*' + re.escape(unit) + r'\s*$', value):
                value = f'{value} {unit}'.strip()
            key = norm_key(label)
            if key not in seen:
                seen.add(key)
                rows.append({'label': label, 'value': value})
    for section in ds.get('columns', {}) or {}:
        for col in (ds['columns'].get(section) or []):
            for r in col.get('rows', []) or []:
                label = (r.get('label') or '').strip()
                value = (r.get('value') or '').strip()
                if label and value and value != '—':
                    key = norm_key(label)
                    if key not in seen:
                        seen.add(key)
                        rows.append({'label': label, 'value': value})
    return rows


def clean_collection_specs(rows):
    """Drop noisy colon-dump split-label artifacts from collection member specs."""
    # Labels that are clearly split artifacts (a stray word fused with a real key).
    junk_label = re.compile(
        r'ies file|additional features|pc lens|mounting option|mount additional|'
        r'wire track|^led chip$|^aluminium |^iec|^ce |^rohs |^erp |dimensions?|'
        r'mount/3', re.I)
    out = []
    for s in rows:
        label = s.get('label') or ''
        if junk_label.search(label):
            continue
        out.append(s)
    return out


def merge_specs(primary, secondary):
    """Merge secondary spec rows into primary, preserving order and deduping."""
    out = list(primary)
    seen = {norm_key(s['label']) for s in out}
    for s in secondary:
        if norm_key(s['label']) not in seen:
            seen.add(norm_key(s['label']))
            out.append(s)
    return out


def datasheet_hero(ds):
    """Return the curated hero image for a datasheet, or None.

    The datasheet heroImage points at a curated product render in
    public/product-images/ (e.g. '../public/product-images/gu10.png') which is
    served at /product-images/<file>. Returns an absolute web path.
    """
    if not ds:
        return None
    src = (ds.get('heroImage') or {}).get('src', '')
    if not src:
        return None
    # '../public/product-images/gu10.png' -> '/product-images/gu10.png'
    rel = src.replace('../', '').lstrip('/')
    if rel.startswith('public/'):
        rel = rel[len('public/'):]
    if '/scraped/' in rel:
        return None
    return '/' + rel.lstrip('/')


def parse_spec_dump(text):
    """Parse a colon-delimited 'Label: value' spec dump into [{label, value}]."""
    text = clean_text(text or '')
    if not text or ':' not in text:
        return []
    # Split on '<Label>: <value>' where the label is a short capitalized phrase.
    # Use a lookahead so values that contain digits/symbols aren't split.
    parts = re.split(r'(?=(?:[A-Z][a-zA-Z]+(?:\s+[A-Za-z]+)*):)', text)
    out = []
    for part in parts:
        m = re.match(r'^\s*([A-Z][A-Za-z0-9 /()\-]*?)\s*:\s*(.*)$', part.strip())
        if not m:
            continue
        label = clean_text(m.group(1).rstrip(':'))
        value = clean_text(m.group(2))
        if label and value and value != '—':
            out.append({'label': label, 'value': value})
    return out


def clean_text(s):
    if not s:
        return ''
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def smart_title(s):
    """Title-case words but keep real acronyms/numbers intact.

    Only transforms words that are entirely lowercase (so 'legend' -> 'Legend')
    and never mangles mixed-case words like 'PROTEGA' or 'COB'.
    """
    s = s.strip()
    if not s:
        return s
    KEEP_UPPER = {'COB', 'LED', 'CCT', 'IP', 'UGR', 'CRI', 'GU10', 'RGB', 'AC', 'DC', 'HF', 'IR', 'IEC', 'W', 'V', 'X'}
    words = s.split()
    out = []
    for w in words:
        base = w.rstrip('.,;:')
        punct = w[len(base):]
        if base.isupper() or base.upper() in KEEP_UPPER:
            out.append(base + punct)
        elif base.islower():
            # Fix only fully-lowercase words (capitalise first letter).
            out.append(base[0].upper() + base[1:] + punct)
        else:
            out.append(base + punct)
    return ' '.join(out)


def strip_supplier_prefix(entry):
    """Remove the leading NN- and supplier token from a folder entry name."""
    s = re.sub(r'^\d+-', '', entry)
    s = re.sub(r'^(orbitx|rubicon|ledwise|pioled|ledsc4|superlume|kinglong|steinel|lby)-', '', s)
    return s


# Explicit display-name overrides (keyed by folder path relative to products/).
# Used where the README title is folder-derived or awkwardly cased.
NAME_OVERRIDES = {
    'Solar/01-superlume-sky-ele-15-all-in-one-solar-post-top-light': 'Sky ELE-15 Solar Post Top',
    'Solar/02-superlume-sky-spt-150-solar-post-top-light-self-sustaining-outdoor-lighting': 'Sky SPT-150 Solar Post Top',
    'Solar/03-pioled-25w-vista-solar-led-ip66-post-top': 'Vista Solar Post Top',
    'Sensors/13-steinel-sens-iq-s': 'Sens IQ S',
    'Sensors/14-steinel-smart-remote': 'Smart Remote',
    'Sensors/15-steinel-service-remote': 'Service Remote',
    'Sensors/03-steinel-light-sensor': 'Light Sensor',
    'Linears/10-rubicon-protega-gen-2': 'Protega Gen 2',
    'Linears/14-rubicon-lf55': 'LF55',
    'Outdoor Architectural/26-superlume-square-led-wall': 'ZOD101 Square LED Wall',
    'Outdoor Architectural/27-superlume-round-led-wall': 'ZOD102 Round LED Wall',
}


def clean_scrape_name(name):
    """Clean a supplier-site product name into a tidy short display name."""
    s = clean_text(name or '')
    s = re.split(r'\s*[–\-—]\s*', s, maxsplit=1)[0].strip()
    s = re.sub(r'\s+(LED|Lighting|Luminaire|Light)\s*$', '', s, flags=re.I).strip()
    return smart_title(s.strip(' -–—'))


def resolve_name(readme_path, scrape_name, row, entry, folder_rel):
    """Pick the best display name for a product.

    Uses the curated README title (smart title-cased) for every product, since
    those are the clean, human names from the scrape. An explicit override map
    handles the handful of folder-derived Solar entries and quirky casing.
    """
    if folder_rel in NAME_OVERRIDES:
        return NAME_OVERRIDES[folder_rel]

    title = ''
    if os.path.exists(readme_path):
        for line in open(readme_path, encoding='utf-8'):
            if line.startswith('# '):
                title = line[2:].strip()
                break
    candidate = title or (row.get('lumenx') or row.get('name') or entry)
    result = smart_title(clean_text(candidate).strip(' -–—'))
    result = re.sub(r'^The\s+', '', result)
    result = re.sub(r'\s+Series$', '', result)
    if not result:
        result = strip_supplier_prefix(entry).replace('-', ' ').title()
    return result


JUNK_PREFIXES = [
    'DOWNLOAD CATALOGUE', 'DOWNLOAD CATALOG', 'DOWNLOAD SPEC SHEET',
    'DOWNLOAD SPECS', 'DOWNLOAD DATASHEET', 'CLICK HERE', 'VIEW MORE',
]


def clean_description(s):
    s = clean_text(s)
    for p in JUNK_PREFIXES:
        if s.upper().startswith(p):
            s = s[len(p):].lstrip()
            break
    # strip trailing CTA churn
    s = re.sub(r'\s*(DOWNLOAD SPEC SHEET|DOWNLOAD CATALOGUE|DOWNLOAD CATALOG)\s*\.?$', '', s, flags=re.I)
    return s.strip()


# Manufacturer brand names to scrub from descriptions/summaries (rebranding —
# the site is now LumenX, so we don't credit the supplier).
BRAND_NAMES = [
    'Kinglong Lighting', 'Kinglong', 'PioLED Lighting', 'PioLED', 'Pioled',
    'OrbitX', 'Rubicon', 'Ledwise', 'LEDwise', 'LEDsC4', 'LEDSC4',
    'Steinel', 'Superlume', 'LBY Africa', 'LBY', 'Sunfor', 'LEDVANCE',
    'Spazio', 'Mez',
]


def scrub_brands(text):
    """Remove manufacturer brand names from prose (rebranding to LumenX)."""
    s = text or ''
    for brand in BRAND_NAMES:
        # "by <Brand>" / "from <Brand>" / "of <Brand>" → drop the phrase
        s = re.sub(r'\s+(?:by|from|of)\s+' + re.escape(brand) + r'\b', ' ', s, flags=re.I)
        # leading "<Brand> " / trailing " <Brand>"
        s = re.sub(r'\b' + re.escape(brand) + r'\s+', '', s, flags=re.I)
        s = re.sub(r'\s+' + re.escape(brand) + r'\b', '', s, flags=re.I)
    # tidy leftover "word ," / "word ." from the phrase removal
    s = re.sub(r'\s+([,.])', r'\1', s)
    return clean_text(s)


def parse_readme_specs(path):
    """Parse the '## Specifications' markdown table -> list of {label, value}."""
    specs = []
    if not os.path.exists(path):
        return specs
    lines = open(path, encoding='utf-8').read().splitlines()
    capture = False
    for line in lines:
        if line.strip().startswith('## '):
            capture = line.strip() == '## Specifications'
            continue
        if not capture or not line.strip().startswith('|'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 2:
            continue
        # Skip separator rows (all dashes) and header rows.
        if any(c and set(re.sub(r'\s', '', c)) == {'-'} for c in cells):
            continue  # --- | --- | ---
        normalized = [re.sub(r'[^a-z0-9]', '', c).lower() for c in cells]
        first_norm = normalized[0]
        if first_norm in ('group',) or (len(cells) >= 2 and normalized[1] in ('specification', 'value')) or 'specificationvalue' in ' '.join(normalized):
            # A table header row (Group/Specification/Value with no data).
            if all(n in ('', 'group', 'specification', 'value') for n in normalized):
                continue
        group = cells[0]
        # [Group, Specification, Value] or [Specification, Value].
        if len(cells) >= 3:
            spec, value = cells[1], cells[2]
        else:
            spec, value = cells[0], cells[1]
        label = spec if spec and spec != '—' else (group if group and group != '—' else '')
        if not label or label in ('Specification', 'Value', 'Group') or not value or value == '—':
            continue
        specs.append({'label': label, 'value': value})
    return specs


def read_readme_line(path, header):
    """Return the paragraph following a '## <header>' section."""
    if not os.path.exists(path):
        return ''
    lines = open(path, encoding='utf-8').read().splitlines()
    capture = False
    out = []
    for line in lines:
        if line.strip().startswith('## '):
            capture = line.strip() == f'## {header}'
            continue
        if capture:
            if line.strip().startswith('#') and not line.strip().startswith('## '):
                break
            if line.strip().startswith('|') or line.strip().startswith('![') or line.strip().startswith('>'):
                continue
            if line.strip():
                out.append(line.strip())
            elif out:
                break
    return clean_text(' '.join(out))


def read_readme_bullets(path, header):
    if not os.path.exists(path):
        return []
    lines = open(path, encoding='utf-8').read().splitlines()
    capture = False
    out = []
    for line in lines:
        if line.strip().startswith('## '):
            capture = line.strip() == f'## {header}'
            continue
        if capture:
            if line.strip().startswith('## '):
                break
            m = re.match(r'^\s*[-*]\s+(.+)$', line)
            if m:
                out.append(clean_text(m.group(1)))
    return out


FEATURE_LABEL_TEMPLATES = [
    ('IP Rating', 'IP{} rated'),
    ('IP', 'IP{} rated'),
    ('CRI', 'CRI {}'),
    ('Colour Temperature', '{} colour temperature'),
    ('CCT', '{} colour temperature'),
    ('Beam Angle', '{} beam'),
    ('Beam', '{} beam'),
    ('Wattage', '{} power'),
    ('Voltage', '{} input'),
    ('Input Voltage', '{} input'),
    ('Dimming', 'Dimming: {}'),
    ('Control', 'Control: {}'),
    ('Mounting', '{} mounting'),
    ('Housing', '{} housing'),
    ('Material', '{}'),
    ('Finish', '{} finish'),
    ('LED Chips', '{} LEDs'),
    ('Surge Protection', '{} surge protection'),
    ('Lifetime', '{} lifetime'),
    ('Nominal Lifetime', '{} lifetime'),
    ('Guarantee', '{} guarantee'),
    ('Warranty', '{} warranty'),
    ('Power Factor', 'Power factor {}'),
    ('Power', '{} power'),
    ('Lumen Output', 'Up to {}'),
    ('Lumens', '{} lumens'),
    ('Efficacy', '{} efficacy'),
    ('Light Quality', '{} light quality'),
    ('UGR', 'UGR {}'),
    ('Colour', '{} finish'),
    ('Trim Colour', '{} trim'),
    ('Options', '{}'),
    ('Configuration', '{} configuration'),
]


# Keys that may legitimately appear embedded at the start of a spec label
# (e.g. "IP Rating", "Nominal Lifetime"). Everything else must match exactly.
PREFIX_KEYS = {'ip rating', 'ip', 'nominal lifetime', 'colour temperature', 'beam angle',
               'input voltage', 'lumen output', 'led chips', 'surge protection'}


def apply_feature_template(lkey, tmpl, value):
    """Apply a feature template without duplicating a prefix already in value.

    e.g. ('IP Rating', 'IP{} rated') + value 'IP20' -> 'IP20 rated' (not
    'IPIP20 rated'); ('Warranty', '{} warranty') + value '5 year warranty...'
    -> the raw warranty text (not '... warranty warranty').
    """
    value = clean_text(value or '')
    if not value:
        return None
    # Skip cross-reference values that are not a real attribute (e.g. "See
    # Configurations table", "Please complete the selection above").
    if re.search(r'\b(see|refer to|please complete|choose|select)\b', value, re.I):
        return None
    # If the value already begins with the template's leading keyword, don't
    # prepend it again. We infer the leading keyword from the template (text
    # before the '{').
    leading = tmpl.split('{')[0].strip()
    if leading:
        # Normalise case for the comparison.
        if value.lower().strip().startswith(leading.lower().strip()):
            # Already prefixed — just trim any trailing keyword from the value
            # if the template repeats it at the end, otherwise return value.
            trailing = tmpl.split('}')[-1].strip()
            if trailing:
                t = trailing.lower().strip()
                low = value.lower().strip()
                # Avoid "X ... warranty warranty": if the value already ends in
                # the trailing keyword, return it verbatim.
                if not low.endswith(t):
                    return f'{value} {trailing}'.strip()
                return value.strip()
            return value.strip()
    phrase = tmpl.format(value)
    phrase = clean_text(phrase)
    # Detect & remove accidental doubled trailing keyword (e.g. 'warranty warranty').
    words = phrase.split()
    if len(words) >= 2 and words[-1].lower() == words[-2].lower():
        phrase = ' '.join(words[:-1])
    # Tidy trailing punctuation/comma from scraped values ("White," -> "White").
    phrase = re.sub(r'\s*[,\s]+\s*$', '', phrase).strip()
    return phrase


def derive_features(specs, description, name=''):
    features = []
    seen = set()
    for s in specs:
        label = s['label']
        value = s['value']
        for lkey, tmpl in FEATURE_LABEL_TEMPLATES:
            lk = lkey.lower()
            lab = label.lower()
            # Only allow startswith matching for the curated prefix keys;
            # otherwise require an exact label match to avoid mis-templating.
            if lk in PREFIX_KEYS:
                match = lab.startswith(lk)
            else:
                match = lab == lk
            if match:
                phrase = apply_feature_template(lkey, tmpl, value)
                if phrase and phrase not in seen and len(value) < 80:
                    seen.add(phrase)
                    features.append(phrase)
                break
    # Provide a sensible fallback so the feature sidebar is never empty/thin.
    if not features and description:
        first_sentence = re.split(r'(?<=[.!?])\s', description)[0]
        if 20 <= len(first_sentence) <= 160:
            features.append(first_sentence.rstrip('.'))
    if len(features) < 2:
        extra = f'Part of the {name} range' if name else 'Designed for its application'
        if extra not in features:
            features.append(extra)
        if len(features) < 2:
            features.append('Available in multiple configurations')
    return features[:8]


CATEGORY_APPLICATIONS = {
    'bulkheads': ['Corridors', 'Stairwells', 'Entrances', 'Wet areas'],
    'downlights': ['Offices', 'Retail', 'Hospitality', 'Residential'],
    'floods': ['Facades', 'Security', 'Yards', 'Area lighting'],
    'highbays': ['Warehouses', 'Factories', 'Logistics', 'Manufacturing'],
    'linears': ['Offices', 'Retail', 'Education', 'Architectural interiors'],
    'indoor-architectural': ['Offices', 'Hospitality', 'Retail', 'Residential'],
    'decorative': ['Hotels', 'Restaurants', 'Residences', 'Feature interiors'],
    'outdoor-architectural': ['Facades', 'Gardens', 'Pathways', 'Plazas'],
    'panels': ['Offices', 'Education', 'Healthcare', 'Corporate'],
    'strips': ['Cove lighting', 'Display shelving', 'Signage', 'Joinery accent'],
    'profiles': ['Coves', 'Joinery', 'Display', 'Millwork'],
    'sensors': ['Offices', 'Warehouses', 'Corridors', 'Parking'],
    'solar': ['Estates', 'Parks', 'Isolated streets', 'Gate posts'],
    'track': ['Retail', 'Galleries', 'Showrooms', 'Hospitality'],
    'vapourproof': ['Parking', 'Industrial', 'Canopies', 'Utility areas'],
}


def is_spec_dump(s):
    """True when a scraped description is really a raw spec listing, not prose."""
    s = s or ''
    if not s:
        return True
    # Spec dumps are crammed with 'Label: value', '|', '=' separators.
    if '|' in s:
        return True
    if s.count(':') >= 3:
        return True
    if len(s) > 300:
        return True
    return False


def with_article(singular):
    """Prefix a singular noun with a/an, choosing by vowel sound."""
    if not singular:
        return singular
    # Treat a few acronym-led nouns as 'a'.
    if singular.upper().startswith(('USB', 'LED', 'UHF', 'IEC')):
        return 'a ' + singular
    return ('an ' if singular[:1].lower() in 'aeiou' else 'a ') + singular


def cat_singular(cat_title):
    """Return a singular noun phrase for a category title (for 'a X supplied by')."""
    return {
        'Bulkheads': 'bulkhead',
        'Downlights': 'downlight',
        'Floodlights': 'floodlight',
        'Highbays': 'highbay',
        'Linear Lighting': 'linear luminaire',
        'Panels': 'panel',
        'LED Strips': 'LED strip',
        'Track Lighting': 'track luminaire',
        'Vapour Proof': 'vapour-proof luminaire',
        'Architectural — Indoor': 'indoor architectural luminaire',
        'Decorative': 'decorative luminaire',
        'Architectural — Outdoor': 'outdoor architectural luminaire',
        'Sensors': 'sensor',
        'Solar': 'solar luminaire',
        'Profiles & Accessories': 'profile system',
    }.get(cat_title, cat_title.lower().rstrip('s')).lower()


def build_clean_description(name, cat_title, supplier, specs, applications=None):
    """Build a readable description from structured data when prose is absent."""
    apps = applications or ['commercial', 'industrial', 'architectural']
    app_phrase = ', '.join(apps[:3])
    singular = cat_singular(cat_title)
    start = f'The {name} is a LumenX {singular}.'
    sentences = [start, f'It is designed for {app_phrase} environments.']

    # Add a couple of headline specs phrased naturally.
    preferred = [
        ('Wattage', 'Available in {}'), ('Power', 'Available in {}'),
        ('Lumens', 'Delivers up to {}'), ('Lumen Output', 'Delivers up to {}'),
        ('Efficacy', 'Achieves {}'), ('CCT', 'Available with {}'),
        ('Colour Temperature', 'Available in {}'), ('CRI', 'Offers a CRI of {}'),
        ('IP Rating', 'Rated {}'), ('Beam Angle', 'Provides a {} beam'),
        ('Beam', 'Provides a {} beam'), ('Control', 'Supports {} control'),
        ('Mounting Type', 'Offers {} mounting'), ('Housing', 'Built on a {} platform'),
        ('LED Chips', 'Uses {} LEDs'), ('Surge Protection', 'Includes {} surge protection'),
    ]
    seen = set()
    for s in specs:
        lab = s['label'].lower()
        for key, tmpl in preferred:
            if key.lower() == lab and key not in seen:
                seen.add(key)
                sentences.append(tmpl.format(s['value']) + '.' if not tmpl.format(s['value']).endswith('.') else tmpl.format(s['value']))
                break
        if len(seen) >= 2:
            break
    return ' '.join(sentences)


def derive_warranty(specs, description):
    for s in specs:
        if 'warranty' in s['label'].lower() or 'guarantee' in s['label'].lower():
            if re.search(r'\d', s['value']):
                return s['value']
    blob = (description + ' ' + ' '.join(v for s in specs for v in [s['label'], s['value']])).lower()
    m = re.search(r'(\d+)\s*-?\s*year[a-z]*\s+(warranty|guarantee)', blob)
    if m:
        return f"{m.group(1)}-year warranty"
    return None


# ─────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────
def main():
    categories = OrderedDict()
    products = []
    used_slugs = {}  # category-slug -> set

    # Gather product folders (two levels below PRODUCTS_ROOT).
    folders = []
    for cat_dir in sorted(os.listdir(PRODUCTS_ROOT)):
        cat_path = os.path.join(PRODUCTS_ROOT, cat_dir)
        if not os.path.isdir(cat_path) or cat_dir == '00-INDEX.md':
            continue
        for entry in sorted(os.listdir(cat_path)):
            folder_path = os.path.join(cat_path, entry)
            if os.path.isdir(folder_path):
                folders.append((cat_dir, entry, folder_path))

    copied_images = 0
    copied_pdfs = 0

    # Start fresh so slug changes don't leave stale image directories behind.
    if os.path.isdir(SCRAPED_IMG):
        shutil.rmtree(SCRAPED_IMG)
    os.makedirs(SCRAPED_IMG, exist_ok=True)

    for cat_dir, entry, folder_path in folders:
        pj_path = os.path.join(folder_path, 'product.json')
        readme_path = os.path.join(folder_path, 'README.md')
        if not os.path.exists(pj_path):
            continue
        pj = json.load(open(pj_path, encoding='utf-8'))
        row = pj.get('row', {})

        # Category id (with override for profiles).
        cat_name = FOLDER_CATEGORY_OVERRIDE.get(f'{cat_dir}/{entry}', row.get('category') or cat_dir)
        cat_id, cat_meta = CATEGORY_MAP.get(cat_name, (slugify(cat_name), {
            'title': cat_name, 'description': '', 'applications': '', 'linkLabel': 'Explore',
        }))
        categories.setdefault(cat_id, cat_meta)

        # Name: curated README title (smart title-cased), with the small
        # override map for folder-derived Solar entries.
        folder_rel = f'{cat_dir}/{entry}'
        scrape_name = pj.get('scrape', {}).get('name') or ''
        name = resolve_name(readme_path, scrape_name, row, entry, folder_rel)
        name_clean = name.strip(' -–—')

        # Slug — unique within category.
        base_slug = slugify(name_clean) or slugify(entry)
        used = used_slugs.setdefault(cat_id, set())
        slug = base_slug
        n = 2
        while slug in used:
            slug = f'{base_slug}-{n}'
            n += 1
        used.add(slug)

        # Datasheet payload (hand-curated specs) — used to backfill products
        # whose scrape produced no structured spec table.
        ds = datasheet_for(name_clean) or datasheet_for(row.get('name') or '')

        # Specs: README table first, then scrape.specs, then the authoritative
        # datasheet payload, then a colon-delimited spec dump in the description.
        specs = parse_readme_specs(readme_path)
        if not specs:
            for s in pj.get('scrape', {}).get('specs', []):
                label = s.get('label') or ''
                value = s.get('value') or ''
                if label and value and value != '—':
                    specs.append({'label': label, 'value': value})
        if ds:
            ds_specs = flatten_datasheet_specs(ds)
        else:
            ds_specs = []
        if not specs and ds_specs:
            specs = list(ds_specs)
        elif specs and ds_specs and len(specs) < len(ds_specs):
            specs = merge_specs(specs, ds_specs)
        if not specs:
            raw_desc = pj.get('scrape', {}).get('description') or ''
            specs = parse_spec_dump(raw_desc)

        # Enrich collection products with specs scraped from their member pages.
        col_specs = load_collection_specs().get(entry)
        if col_specs:
            specs = merge_specs(specs, clean_collection_specs(col_specs))

        # Applications.
        apps = CATEGORY_APPLICATIONS.get(cat_id, ['Commercial', 'Industrial', 'Architectural'])
        if ds and ds.get('applications'):
            ds_apps = [clean_text(a) for a in ds['applications'] if clean_text(a)]
            if ds_apps:
                apps = list(dict.fromkeys(ds_apps))

        # Description.
        description = clean_description(read_readme_line(readme_path, 'Description'))
        if description in ('—', '-', '–'):
            description = ''
        if not description:
            page_desc = clean_text(read_readme_line(readme_path, 'Page description'))
            if page_desc and page_desc not in ('—', '-', '–'):
                description = page_desc
        ds_overview = clean_text(' '.join(ds['overview'])) if (ds and ds.get('overview')) else ''
        # Replace near-empty/junk descriptions with the curated datasheet overview.
        if (not description or len(description) < 20 or description in ('Group.', '—', '-', '–')
                or description.lower() in ('none', 'n/a', 'see description')) and ds_overview:
            description = ds_overview
        # If the scraped description is a raw spec dump or empty, build a clean
        # readable description from the structured data.
        if is_spec_dump(description):
            if description and description.count(':') < 3 and '|' not in description:
                # A short real sentence — keep it, just ensure it's readable.
                description = description.strip(' -–—')
            else:
                description = ds_overview or build_clean_description(
                    name_clean, cat_meta['title'], row.get('supplier', ''), specs, apps)
        if not description:
            members = pj.get('scrape', {}).get('members') or []
            if members and not ds_overview:
                description = f'The {name_clean} range includes {len(members)} products.' \
                              f' Contact our team for full details on each configuration.'
            elif ds_overview:
                description = ds_overview
            else:
                description = build_clean_description(name_clean, cat_meta['title'], row.get('supplier', ''), specs, apps)

        # Rebranding: strip any manufacturer brand name from the prose.
        description = scrub_brands(description)

        # Summary (short one-liner) — a clean first sentence of the description.
        first_sentence = re.split(r'(?<=[.!?])\s', description)[0].strip()
        summary = first_sentence if 25 <= len(first_sentence) <= 200 else description[:160].strip()
        if len(summary) < 25:
            summary = f'The {name_clean} is a LumenX {cat_singular(cat_meta["title"])}.'
        if not summary.endswith('.'):
            summary += '.'
        summary = summary.strip()

        # Features.
        features = read_readme_bullets(readme_path, 'Features')
        if features:
            features = [clean_text(f) for f in features if f]
        else:
            features = derive_features(specs, description, name_clean)
        # Prefer the authoritative datasheet features when available.
        if ds and ds.get('features'):
            ds_feats = [clean_text(f) for f in ds['features'] if clean_text(f)]
            if ds_feats:
                features = list(dict.fromkeys(ds_feats))[:8]
        features = [scrub_brands(f) for f in features if scrub_brands(f)]

        # Warranty.
        warranty = derive_warranty(specs, description)

        # ── Images ──
        img_dir = os.path.join(folder_path, 'images')
        images = pj.get('images', [])
        dest_dir = os.path.join(SCRAPED_IMG, cat_id, slug)
        image_objs = []
        if os.path.isdir(img_dir) and images:
            # Order: real product/hero photos first, dimension drawings last.
            # Within the same type, keep the scraper's hero flag first, then
            # the scraped order. This guarantees a genuine render is the hero.
            index_folder = f'products/{cat_dir}/{entry}'
            ordered = sorted(
                images,
                key=lambda i: (
                    image_type_rank(index_folder, i.get('file', ''), (i.get('kind') or '')),
                    0 if i.get('hero') else 1,
                    i.get('file', ''),
                ),
            )
            os.makedirs(dest_dir, exist_ok=True)
            for i in ordered:
                fname = i['file']
                src = os.path.join(img_dir, fname)
                if not os.path.exists(src) or not fname:
                    continue
                dst = os.path.join(dest_dir, fname)
                if not os.path.exists(dst):
                    shutil.copy2(src, dst)
                    copied_images += 1
                # Decide fit: show the whole product (contain) for product-like
                # images; only fill the frame (cover) for genuine lifestyle /
                # application scenes. We don't know the photo content, so:
                #  - PNG/WebP renders and dimension drawings -> contain
                #  - JPG/avif product & hero shots -> contain (show the fixture)
                #  - application / case-study / banner images -> cover
                w = i.get('w') or 0
                h = i.get('h') or 0
                kind = (i.get('kind') or '').lower()
                ext = os.path.splitext(fname)[1].lower()
                scene_kind = kind in ('application', 'case study', 'banner', 'banner/teaser')
                is_render = ext in ('.png', '.webp') and kind in ('hero', 'gallery', 'doc', 'product')
                # Product/hero JPGs are usually the fixture on a clean background —
                # show them fully so nothing is cropped.
                is_product_photo = kind in ('hero', 'gallery', 'product') and ext in ('.jpg', '.jpeg', '.avif')
                fit = 'cover' if scene_kind else ('contain' if (is_render or is_product_photo) else 'cover')
                alt = i.get('alt') or fname
                image_objs.append({'src': f'/scraped/{cat_id}/{slug}/{fname}',
                                   'fit': fit, 'alt': alt, 'width': w or None, 'height': h or None})
            # Cap the gallery so a collection page with many tiny member-card
            # thumbnails doesn't overflow the carousel. Keep the hero + first
            # 11 (12 total); they're the most representative variants.
            if len(image_objs) > 12:
                image_objs = image_objs[:12]
        if not image_objs:
            # Fallback placeholder so the page still renders.
            image_objs = [{'src': f'/product-images/categories/{cat_id}.jpg', 'fit': 'cover', 'alt': name_clean}]

        # Fall back to the curated datasheet hero ONLY when the product has no
        # usable scraped photo. A scraped photo counts as usable if its larger
        # dimension is ≥400px (a wide 800×383 render is fine) — this avoids
        # overriding real product photos with the old 300px curated renders.
        has_good_scraped = any(
            im['src'].startswith('/scraped/')
            and max(im.get('width') or 0, im.get('height') or 0) >= 400
            for im in image_objs
        )
        hero_path = datasheet_hero(ds)
        if hero_path and not has_good_scraped:
            if not (image_objs and image_objs[0]['src'] == hero_path):
                hero_w = hero_h = None
                hero_abs = os.path.join(ROOT, 'public', hero_path.lstrip('/'))
                if os.path.exists(hero_abs):
                    try:
                        with open(hero_abs, 'rb') as fh:
                            head = fh.read(33)
                        if head[:8] == b'\x89PNG\r\n\x1a\n':
                            import struct as _struct
                            hero_w, hero_h = _struct.unpack('>II', head[16:24])
                        elif head[:2] == b'\xff\xd8':
                            from PIL import Image as _Image
                            im = _Image.open(hero_abs)
                            hero_w, hero_h = im.size
                    except Exception:
                        hero_w = hero_h = None
                hero_obj = {'src': hero_path, 'fit': 'contain', 'alt': name_clean}
                if hero_w and hero_h:
                    hero_obj['width'] = hero_w
                    hero_obj['height'] = hero_h
                image_objs.insert(0, hero_obj)

        imageUrl = image_objs[0]['src']
        all_images = image_objs

        # ── Datasheet PDF ──
        # Every product gets a generated datasheet PDF (rendered on demand from
        # server/datasheets-data/<slug>.json + the shared template) via the
        # /api/download/datasheet/generated/<slug> route.
        ds_slug = datasheet_slug_for(name_clean, slug)
        pdf_url = f'/api/download/datasheet/generated/{ds_slug}'

        # Product record (superset of the site's Product type).
        product = {
            'slug': slug,
            'name': name_clean,
            'category': cat_id,
            'summary': summary,
            'description': description,
            'specs': specs,
            'features': features,
            'applications': apps,
            'imageUrl': imageUrl,
            'images': all_images,
        }
        product['pdfUrl'] = pdf_url
        product['datasheetSlug'] = ds_slug
        if warranty:
            product['warranty'] = warranty

        products.append(product)

    # ── Emit TypeScript ──
    def js_str(s):
        return json.dumps(s, ensure_ascii=False)

    lines = []
    lines.append('// AUTO-GENERATED from data-scrape/products — do not edit by hand.')
    lines.append('// Run: python3 data-scrape/generate_catalogue.py')
    lines.append("import { Product, ProductCategory } from './types';")
    lines.append('')
    lines.append('export const SCRAPED_CATEGORIES: ProductCategory[] = [')
    for cat_id, meta in categories.items():
        lines.append('  {')
        lines.append(f"    id: {js_str(cat_id)},")
        lines.append(f"    title: {js_str(meta['title'])},")
        lines.append(f"    description: {js_str(meta['description'])},")
        lines.append(f"    applications: {js_str(meta['applications'])},")
        lines.append(f"    imageUrl: {js_str(f'/product-images/categories/{cat_id}.jpg')},")
        lines.append(f"    linkLabel: {js_str(meta['linkLabel'])},")
        lines.append('  },')
    lines.append('];')
    lines.append('')
    lines.append('export const SCRAPED_PRODUCTS: Product[] = [')
    for p in products:
        lines.append('  {')
        lines.append(f"    slug: {js_str(p['slug'])},")
        lines.append(f"    name: {js_str(p['name'])},")
        lines.append(f"    category: {js_str(p['category'])},")
        lines.append(f"    summary: {js_str(p['summary'])},")
        lines.append(f"    description: {js_str(p['description'])},")
        # specs
        lines.append('    specs: [')
        for s in p['specs']:
            lines.append(f"      {{ label: {js_str(s['label'])}, value: {js_str(s['value'])} }},")
        lines.append('    ],')
        lines.append('    features: [')
        for f in p['features']:
            lines.append(f"      {js_str(f)},")
        lines.append('    ],')
        lines.append('    applications: [')
        for a in p['applications']:
            lines.append(f"      {js_str(a)},")
        lines.append('    ],')
        lines.append(f"    imageUrl: {js_str(p['imageUrl'])},// hero")
        lines.append('    images: [')
        for im in p['images']:
            w = im.get('width') or 0
            h = im.get('height') or 0
            extra = ''
            if w and h:
                extra = f", width: {w}, height: {h}"
            lines.append(f"      {{ src: {js_str(im['src'])}, fit: {js_str(im.get('fit', 'cover'))}, alt: {js_str(im.get('alt', ''))}{extra} }},")
        lines.append('    ],')
        if p.get('pdfUrl'):
            lines.append(f"    pdfUrl: {js_str(p['pdfUrl'])},")
        if p.get('warranty'):
            lines.append(f"    warranty: {js_str(p['warranty'])},")
        lines.append('  },')
    lines.append('];')
    lines.append('')

    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'Products: {len(products)}')
    print(f'Categories: {len(categories)}')
    print(f'Images copied: {copied_images}')

    # Ensure a datasheet JSON exists for every product's datasheet slug, and
    # rebrand its name/fileStem to the LumenX name (keeping curated specs).
    os.makedirs(DASH_OUT_DIR, exist_ok=True)
    datasheet_written = 0
    datasheet_rebranded = 0
    for p in products:
        ds_slug = p.get('datasheetSlug')
        if not ds_slug:
            continue
        existing = os.path.join(DASH_OUT_DIR, f'{ds_slug}.json')
        name_upper = p['name'].upper()
        if os.path.exists(existing):
            try:
                payload = json.load(open(existing, encoding='utf-8'))
                changed = False
                if payload.get('name') != name_upper:
                    payload['name'] = name_upper
                    changed = True
                if payload.get('fileStem') != p['name']:
                    payload['fileStem'] = p['name']
                    changed = True
                # scrub brand from variant/overview too
                if payload.get('variant'):
                    v = scrub_brands(payload['variant'])
                    if v != payload['variant']:
                        payload['variant'] = v
                        changed = True
                if changed:
                    with open(existing, 'w', encoding='utf-8') as f:
                        json.dump(payload, f, ensure_ascii=False, indent=2)
                    datasheet_rebranded += 1
            except Exception:
                pass
        else:
            payload = build_datasheet_payload(p)
            with open(existing, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            datasheet_written += 1
    print(f'Datasheet JSONs generated (missing only): {datasheet_written}')
    print(f'Datasheet JSONs rebranded: {datasheet_rebranded}')
    print(f'Wrote: {OUT_TS}')


if __name__ == '__main__':
    main()
