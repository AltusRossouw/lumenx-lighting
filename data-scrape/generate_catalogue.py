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
    start = f'The {name} is {with_article(singular)} supplied by {supplier}.'
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

        # Specs: README table first, fall back to scrape.specs.
        specs = parse_readme_specs(readme_path)
        if not specs:
            for s in pj.get('scrape', {}).get('specs', []):
                label = s.get('label') or ''
                value = s.get('value') or ''
                if label and value and value != '—':
                    specs.append({'label': label, 'value': value})

        # Applications.
        apps = CATEGORY_APPLICATIONS.get(cat_id, ['Commercial', 'Industrial', 'Architectural'])

        # Description.
        description = clean_description(read_readme_line(readme_path, 'Description'))
        if description in ('—', '-', '–'):
            description = ''
        if not description:
            page_desc = clean_text(read_readme_line(readme_path, 'Page description'))
            if page_desc and page_desc not in ('—', '-', '–'):
                description = page_desc
        # If the scraped description is a raw spec dump or empty, build a clean
        # readable description from the structured data.
        if is_spec_dump(description):
            if description and description.count(':') < 3 and '|' not in description:
                # A short real sentence — keep it, just ensure it's readable.
                description = description.strip(' -–—')
            else:
                description = build_clean_description(
                    name_clean, cat_meta['title'], row.get('supplier', ''), specs, apps)
        if not description:
            members = pj.get('scrape', {}).get('members') or []
            if members:
                description = f'The {name_clean} range from {row.get("supplier", "")} includes {len(members)} products.' \
                              f' Contact our team for full details on each configuration.'
            else:
                description = build_clean_description(name_clean, cat_meta['title'], row.get('supplier', ''), specs, apps)

        # Summary (short one-liner) — a clean first sentence of the description.
        first_sentence = re.split(r'(?<=[.!?])\s', description)[0].strip()
        summary = first_sentence if 25 <= len(first_sentence) <= 200 else description[:160].strip()
        if len(summary) < 25:
            summary = f'The {name_clean} is {with_article(cat_singular(cat_meta["title"]))} from {row.get("supplier", "LumenX")}.'
        if not summary.endswith('.'):
            summary += '.'
        summary = summary.strip()

        # Features.
        features = read_readme_bullets(readme_path, 'Features')
        if features:
            features = [clean_text(f) for f in features if f]
        else:
            features = derive_features(specs, description, name_clean)

        # Warranty.
        warranty = derive_warranty(specs, description)

        # ── Images ──
        img_dir = os.path.join(folder_path, 'images')
        images = pj.get('images', [])
        dest_dir = os.path.join(SCRAPED_IMG, cat_id, slug)
        image_objs = []
        if os.path.isdir(img_dir) and images:
            # Order: hero first, then the rest in the scraped order.
            ordered = sorted(images, key=lambda i: (0 if i.get('hero') else 1, i.get('file', '')))
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
                # Decide fit: transparent PNG/product renders get 'contain';
                # wide lifestyle/application photos get 'cover'.
                w = i.get('w') or 0
                h = i.get('h') or 0
                kind = (i.get('kind') or '').lower()
                ext = os.path.splitext(fname)[1].lower()
                is_render = kind in ('hero', 'product') and ext in ('.png', '.webp')
                if w and h and h > 0:
                    ratio = w / h
                    too_wide = ratio > 1.6
                    too_tall = ratio < 0.75
                else:
                    too_wide = too_tall = False
                fit = 'contain' if (is_render and not too_wide and not too_tall) else 'cover'
                alt = i.get('alt') or fname
                image_objs.append({'src': f'/scraped/{cat_id}/{slug}/{fname}', 'fit': fit, 'alt': alt})
            # Cap the gallery so a collection page with many tiny member-card
            # thumbnails doesn't overflow the carousel. Keep the hero + first
            # 11 (12 total); they're the most representative variants.
            if len(image_objs) > 12:
                image_objs = image_objs[:12]
        if not image_objs:
            # Fallback placeholder so the page still renders.
            image_objs = [{'src': f'/product-images/categories/{cat_id}.jpg', 'fit': 'cover', 'alt': name_clean}]

        imageUrl = image_objs[0]['src']
        all_images = image_objs

        # ── Datasheet PDF ──
        pdf_url = None
        pdf_file = pj.get('pdfFile')
        if pdf_file:
            src_pdf = os.path.join(folder_path, pdf_file)
            if os.path.exists(src_pdf) and pdf_file.lower().endswith('.pdf'):
                dst_pdf = os.path.join(DATASHEETS, f'{slug}.pdf')
                if not os.path.exists(dst_pdf):
                    shutil.copy2(src_pdf, dst_pdf)
                    copied_pdfs += 1
                pdf_url = f'/api/download/datasheet/{slug}.pdf'

        # Product record (superset of the site's Product type).
        product = {
            'slug': slug,
            'name': name_clean,
            'category': cat_id,
            'supplier': row.get('supplier') or '',
            'summary': summary,
            'description': description,
            'specs': specs,
            'features': features,
            'applications': apps,
            'imageUrl': imageUrl,
            'images': all_images,
        }
        if pdf_url:
            product['pdfUrl'] = pdf_url
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
        lines.append(f"    supplier: {js_str(p['supplier'])},")
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
            lines.append(f"      {{ src: {js_str(im['src'])}, fit: {js_str(im.get('fit', 'cover'))}, alt: {js_str(im.get('alt', ''))} }},")
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
    print(f'PDFs copied: {copied_pdfs}')

    # Remove orphaned scraped datasheets (non-LumenX) that are no longer
    # referenced, so renaming a product doesn't leave stale downloads behind.
    referenced_slugs = {s.replace('.pdf', '') for s in os.listdir(DATASHEETS) if s.endswith('.pdf') and not s.startswith('LumenX_Datasheet')}
    wanted_slugs = set()
    for p in products:
        if p.get('pdfUrl'):
            wanted_slugs.add(p['pdfUrl'].rsplit('/', 1)[-1].replace('.pdf', ''))
    removed = 0
    if os.path.isdir(DATASHEETS):
        for f in os.listdir(DATASHEETS):
            if f.endswith('.pdf') and not f.startswith('LumenX_Datasheet'):
                slug = f[:-4]
                if slug not in wanted_slugs:
                    try:
                        os.remove(os.path.join(DATASHEETS, f))
                        removed += 1
                    except OSError:
                        pass
    print(f'Stale datasheets removed: {removed}')

    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'Wrote: {OUT_TS}')


if __name__ == '__main__':
    main()
