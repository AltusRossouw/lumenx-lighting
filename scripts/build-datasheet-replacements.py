#!/usr/bin/env python3
"""Generate Keynote replacement maps for every product that has a datasheet payload.

The site ships LumenX-branded A4 spec sheets produced from a Keynote template by
`scripts/generate-keynote-datasheet.mjs`. The 24 products already live each had a
replacement map written by hand. This script produces one for every remaining
product from its payload in `server/datasheets-data/<slug>.json`, so the whole
catalogue can be rendered without per-product authoring.

Template
--------
`lumenx-datasheet-saxa-triproof.key` is used as the base because it is the only
one that is simultaneously:
  * table-free          - nothing to blank out for products with no configuration table
  * distinct watermark  - watermark and title differ, so both can be set independently
                          (a plain replacement rewrites every matching item)
  * collision-free      - ELECTRICAL sits at y=464 and Weight at y=478; the generator
                          matches rows by label Y, so rows closer than 3pt would
                          overwrite the heading. The linear template collides here.

Output: scripts/examples/generated/<payload-slug>.json
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'server', 'datasheets-data')
OUT = os.path.join(ROOT, 'scripts', 'examples', 'generated')

TEMPLATE = {
    'path': 'public/catalogues/lumenx/lumenx-datasheet-saxa-triproof.key',
    'watermark': 'LINEARS',
    'title': '48W 3CCT Tri-Proof 5ft Linear',
    'overview_trigger': 'most demanding environments',
    'chips': ['POWER', 'LUMENS', 'RATING'],
    # the template's original chip values, needed to target a chip for deletion
    'chip_values': ['48W', '7200lm', 'IP65'],
    'left_slots': ['Dimensions (mm)', 'Weight', 'Housing', 'Mounting',
                   'Certifications', 'Class Rating', 'Warranty'],
    # UGR is deliberately absent: its template value is "-", and the generator
    # deletes dash-only text items BEFORE it sets row values, so the slot has no
    # value item left to write into and filling it yields a label with no value.
    'right_slots': ['Lumen Output', 'Lumen Efficacy', 'Colour Temperature', 'CRI',
                    'Beam Angle', 'IP Rating', 'Operating Temp', 'Lifespan',
                    'Luminaire Colour', 'Wattage', 'Input Voltage', 'Frequency',
                    'Power Factor', 'Surge Protection', 'Dimmable', 'Flicker'],
    'app_tags': ['COMMERCIAL', 'INDUSTRIAL', 'RESIDENTIAL'],
    # Row geometry of the template, used to paint over the rows we omit. Every
    # template rules each spec row on the slide LAYOUT, which AppleScript cannot
    # reach, so an omitted row leaves its rule behind unless it is covered.
    # Rows fill top-down, so empties are always the tail of a block.
    'blocks': [
        (30, 256, {'Dimensions (mm)': 463, 'Weight': 478, 'Housing': 494, 'Mounting': 510}),
        (30, 256, {'Certifications': 575, 'Class Rating': 591, 'Warranty': 607}),
        (309, 256, {'Lumen Output': 295, 'Lumen Efficacy': 311, 'Colour Temperature': 327,
                    'CRI': 343, 'Beam Angle': 358, 'UGR': 374, 'IP Rating': 390,
                    'Operating Temp': 406, 'Lifespan': 422, 'Luminaire Colour': 438}),
        (309, 256, {'Wattage': 487, 'Input Voltage': 503, 'Frequency': 519,
                    'Power Factor': 535, 'Surge Protection': 551, 'Dimmable': 566,
                    'Flicker': 582}),
    ],
}

CATEGORY_TITLES = {
    'bulkheads': 'BULKHEADS', 'downlights': 'DOWNLIGHTS', 'floods': 'FLOODLIGHTS',
    'highbays': 'HIGHBAYS', 'linears': 'LINEAR LIGHTING', 'panels': 'PANELS',
    'strips': 'LED STRIPS', 'track': 'TRACK LIGHTING', 'vapourproof': 'VAPOUR PROOF',
    'outdoor-architectural': 'OUTDOOR ARCHITECTURAL',
    'indoor-architectural': 'INDOOR ARCHITECTURAL',
    'sensors': 'SENSORS', 'decorative': 'DECORATIVE', 'solar': 'SOLAR',
    'profiles': 'PROFILES & ACCESSORIES',
}

# stat label -> short chip label
CHIP_LABEL = {
    'wattage': 'POWER', 'power': 'POWER', 'lumens': 'LUMENS', 'lumen output': 'LUMENS',
    'ip rating': 'RATING', 'colour temperature': 'CCT', 'cct': 'CCT',
    'detection angle': 'DETECTION', 'angle': 'ANGLE',
    'fitting material': 'MATERIAL', 'material': 'MATERIAL', 'housing': 'HOUSING',
    'application, place': 'APPLICATION', 'installation': 'INSTALLATION',
    'reach': 'REACH', 'length': 'LENGTH', 'beam angle': 'BEAM', 'cri': 'CRI',
    'efficacy': 'EFFICACY', 'colour rendering index': 'CRI',
    'led colour consistency': 'SDCM', 'profile': 'PROFILE', 'colour': 'COLOUR', 'color': 'COLOUR',
    'configuration': 'CONFIG', 'package content': 'CONTENTS', 'available in': 'OPTIONS',
    'cooling': 'COOLING', 'light source': 'SOURCE', 'mounting height max.': 'HEIGHT',
    'size (representative eco-l001)': 'SIZE', 'article number': 'ARTICLE',
    'pu1, net weight': 'NET WEIGHT', 'flicker free cri': 'CRI',
}

# template row label -> (product labels that belong in it, in priority order)
ROW_ALIASES = {
    'Dimensions (mm)': ['dimensions', 'size', 'profile', 'length', 'diameter'],
    'Weight': ['weight', 'net weight', 'pu1, net weight'],
    'Housing': ['housing', 'material', 'fitting material', 'body'],
    'Mounting': ['mounting', 'installation', 'application place', 'application, place'],
    'Certifications': ['certification', 'certifications', 'standards', 'electrical'],
    'Class Rating': ['class rating', 'class', 'protection class', 'ik rating'],
    'Warranty': ['warranty', "manufacturer's warranty", 'guarantee'],
    'Lumen Output': ['lumen output', 'lumens', 'light output'],
    'Lumen Efficacy': ['luminous efficacy', 'lumen efficacy', 'efficacy'],
    'Colour Temperature': ['colour temperature', 'correlated colour temperature', 'cct'],
    'CRI': ['cri', 'colour rendering index', 'gamut area index'],
    'Beam Angle': ['beam angle', 'angle', 'detection angle'],
    'UGR': ['ugr', 'glare'],
    'IP Rating': ['ip rating', 'ip', 'protection'],
    'Operating Temp': ['operating temp', 'operating temperature', 'ambient temperature',
                       'max ambient temperature', 'min ambient temperature'],
    'Lifespan': ['lifespan', 'nominal lifetime', 'lifetime', 'led lifespan'],
    'Luminaire Colour': ['luminaire colour', 'colour', 'color', 'finish'],
    'Wattage': ['wattage', 'power', 'nominal wattage'],
    'Input Voltage': ['input voltage', 'operating voltage', 'voltage', 'voltage range'],
    'Frequency': ['frequency'],
    'Power Factor': ['power factor'],
    'Surge Protection': ['surge protection', 'surge'],
    'Dimmable': ['dimmable', 'dimming'],
    'Flicker': ['flicker', 'stroboscopic effect'],
}


def looks_like_value(s):
    """True when a row's LABEL is really a value.

    The scraped Steinel tables are partly shifted, so some rows arrive as
    label='1000 W max.' / value='IP54'. A datasheet carrying a wrong spec is worse
    than one carrying fewer specs, so those rows are dropped rather than printed.
    Other suppliers parse cleanly (LEDsC4 0/156 rows, KingLong 0/86).
    """
    s = str(s or '').strip()
    if not s:
        return True
    if re.match(r'^[\d\s.,\-/x×°%]+$', s):
        return True
    return bool(re.search(r'\b(mm|kg|lux|lm|W|V|Hz|IP\d+|°C|hrs?|years?)\b', s))


def norm_value(v):
    """Compare values ignoring spacing, case and the lm/W suffix."""
    t = re.sub(r'[^a-z0-9.]', '', str(v or '').lower())
    return re.sub(r'(lm|w|kw)$', '', t)


def norm(s):
    s = re.sub(r'\(.*?\)', ' ', str(s or '').lower())
    s = re.sub(r'[^a-z0-9, .]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip(' .')


def dash(s):
    """Normalise every dash variant to a plain hyphen so Keynote text is predictable."""
    return re.sub(r'[\u2010-\u2015\u2212]', '-', str(s or '')).strip()


def clean(s, limit=58):
    s = dash(s)
    s = re.sub(r'\s+', ' ', s)
    if len(s) > limit:
        s = s[:limit].rsplit(' ', 1)[0].rstrip(',;') + '...'
    return s


def short_num(v):
    """1234 -> 1.2k ; keeps ranges readable in the narrow stat chips."""
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f >= 10000:
        return f'{f/1000:.0f}k'
    if f >= 1000:
        return f'{f/1000:.1f}'.rstrip('0').rstrip('.') + 'k'
    return f'{f:.0f}'


def range_short(value):
    parts = re.findall(r'\d+(?:[.,]\d+)?', str(value))
    if not parts:
        return None
    nums = [p.replace(',', '.') for p in parts]
    shorts = [short_num(n) for n in nums]
    if len(shorts) >= 2:
        return f'{shorts[0]}-{shorts[-1]}'
    return shorts[0]


def chip_label_for(label):
    n = norm(label)
    if n in CHIP_LABEL:
        return CHIP_LABEL[n]
    return (n.upper()[:12] if n else 'INFO')


def sanitise_stat(value):
    """Repair the ways the scrape mangles a multi-value stat.

    Observed: "650lm / 27 200lm / 15 40lm" (space split inside a number) and
    "6.5W / 160W / 14W / 400W (16" (truncated mid-value). A chip that reads
    "650-40" is worse than one that reads "27k lm", so repair first.
    """
    v = dash(value)
    v = re.sub(r'(?<=\d)\s(?=\d{3}\b)', '', v)   # "27 200" -> "27200"
    v = re.sub(r'\s*\(\s*\d*\s*$', '', v)        # drop trailing "(16"
    return re.sub(r'\s+', ' ', v).strip()


def looks_broken(value):
    """True when the scraped value is too mangled to put in a chip.

    GU10's wattage arrives as '6.5W / 160W / 14W / 400W (16' and its lumens as
    '650lm / 27 200lm / 15 40lm'. Rendering those as "6-400" invents a figure, so
    the chip is dropped and the row is left to speak for itself.
    """
    v = str(value or '')
    if re.search(r'\(\s*\d*\s*$', v):
        return True                      # "... 400W (16" - truncated mid-value
    # A multi-variant list whose numbers are split by spaces ("650lm / 27 200lm /
    # 15 40lm") cannot be read unambiguously. A lone "3 500 lm" is fine - that is
    # just a thousands separator - so only distrust it alongside a list.
    return v.count('/') >= 2 and bool(re.search(r'\d\s\d{2,3}(?!\d)', v))


def chip_text(stat, budget=9):
    """Format a stat for a ~50pt chip.

    The chips are narrow, so a full range like "278-1379 lm" wraps onto two lines
    and breaks the header. Anything longer than the budget collapses to its largest
    single value with a short unit.
    """
    value = sanitise_stat(stat.get('value', ''))
    unit = (stat.get('unit') or '').strip()
    v = value
    if v.lower() in ('', '-', 'see configurations', 'see configurations table'):
        return 'see table'
    # drop parentheticals first: "3500 lm (35W)" would otherwise yield the range
    # 35..3500 and print "35-3.5k"
    v = re.sub(r'\([^)]*\)', ' ', v).strip()
    nums = re.findall(r'\d+(?:[.,]\d+)?', v)
    lum = unit.lower() in ('lm', 'lumen', 'lumens')
    if nums and len(nums) >= 2:
        # min..max, not first..last: a multi-value stat lists the variants of the
        # product ("650lm / 27200lm / 1540lm"), which is not an ordered range.
        ordered = sorted((n.replace(',', '.') for n in nums), key=float)
        lo, hi = short_num(ordered[0]), short_num(ordered[-1])
        s = f'{lo}-{hi}' + (' lm' if lum else '')
    elif unit:
        s = f'{v} {unit}'
    else:
        s = v
    if len(s) > budget and nums:
        biggest = max((n.replace(',', '.') for n in nums), key=float)
        s = (short_num(biggest) or biggest) + (' lm' if lum else '')
    # "CRI80 , CRI90 (CRI95+ on request)" is a list of options, not a range - 80-90
    # reads as a measurement. Show the headline figure instead.
    lbl = norm(stat.get('label', ''))
    if 'cri' in lbl or 'colour rendering' in lbl:
        m = re.search(r'(>?\s*\d+)', v)
        s = ('CRI' + m.group(1).replace(' ', '')) if m else 'CRI'
    return re.sub(r'\s*[,;/]+\s*$', '', s).strip()


def order_renames(renames):
    """Order renames so a target never matches a later source.

    The generator walks the replacement list in order and carries the rewritten
    text forward, so [POWER->RATING, RATING->ANGLE] turns BOTH chips into ANGLE.
    Emitting a pair only once its target is no longer a pending source avoids that.
    """
    remaining = dict(renames)
    out = []
    while remaining:
        ready = [s for s, d in remaining.items() if d not in remaining]
        if not ready:                      # cycle: break arbitrarily, order within a cycle is moot
            ready = [next(iter(remaining))]
        for s in ready:
            out.append((s, remaining.pop(s)))
    return out


ACRONYMS = ('GU10', 'GU5.3', 'COB', 'LED', 'CCT', 'UFO', 'IP', 'CRI', 'DALI', 'SMD',
            'UGR', 'IK', 'RGB', 'RGBW', 'PIR', 'HF', 'UV', 'AC', 'DC', 'E27', 'E14')


def title_case(name):
    """Title-case a product name without mangling acronyms (GU10 -> "Gu10")."""
    out = str(name or '').title()
    for a in ACRONYMS:
        out = re.sub(rf'\b{re.escape(a.title())}\b', a, out)
    return out


def build(slug):
    p = os.path.join(DATA, f'{slug}.json')
    if not os.path.exists(p):
        return None
    d = json.load(open(p))
    t = TEMPLATE

    reps = {}
    # header: watermark and title are different strings in this template, so both
    # can be set independently
    reps[t['watermark']] = CATEGORY_TITLES.get(slug.split('-')[0], d.get('category', '').upper() or 'LIGHTING')
    reps[t['title']] = clean(title_case(d.get('name', slug)), 46)

    # overview
    ov = d.get('overview') or []
    if ov:
        reps['__OVERVIEW_TRIGGER__'] = t['overview_trigger']
        reps['__OVERVIEW_CONTAINS__'] = clean(' '.join(ov), 340)

    # Stat chips. The payload's `stats` array is unreliable: it often repeats the
    # same value under two labels (legend carries Power=10-35, Wattage=10W/20W/35W
    # and a Wattage row), or puts a prose description in a chip. The spec ROWS are
    # the trustworthy source, so build the chips from those and only fall back to
    # `stats` when a row is missing.
    cols0 = d.get('columns') or {}
    all_rows = [r for c in ('left', 'right') for sec in cols0.get(c, []) for r in sec.get('rows', [])]
    stats = d.get('stats') or []

    def find_row(*labels):
        for want in labels:
            for r in all_rows:
                if norm(r.get('label', '')) == want:
                    return r
        return None

    def find_stat(*labels):
        for want in labels:
            for st in stats:
                if norm(st.get('label', '')) == want:
                    return st
        return None

    # Ranked candidates. Products differ wildly in what the scrape captured - the
    # LEDwise range has no wattage or lumens at all - so take the best three that
    # exist rather than insisting on the same three fields for every product.
    chip_candidates = [
        (['wattage', 'power', 'nominal wattage'], ['wattage', 'power']),
        (['lumen output', 'lumens', 'light output'], ['lumens', 'lumen output']),
        (['ip rating', 'ip'], ['ip rating']),
        (['cri', 'colour rendering index'], ['cri']),
        (['colour temperature', 'cct'], ['colour temperature', 'cct']),
        (['luminous efficacy', 'lumen efficacy', 'efficacy'], ['efficacy']),
        (['beam angle'], ['beam angle']),
    ]
    chosen = []
    for row_labels, stat_labels in chip_candidates:
        if len(chosen) >= len(t['chips']):
            break
        src = find_row(*row_labels) or find_stat(*stat_labels)
        if src and looks_broken(src.get('value')):
            src = None            # mangled source: show no chip rather than a wrong one
        if src and chip_text(src) not in {c[1] for c in chosen}:
            chosen.append((src, chip_text(src)))

    stat_pairs, label_renames, omit_stats = {}, {}, []
    used_values = set()
    for i, tmpl_label in enumerate(t['chips']):
        if i < len(chosen):
            src, text = chosen[i]
            stat_pairs[tmpl_label] = text
            used_values.add(text)
            want = chip_label_for(src.get('label', ''))
            if want and want != tmpl_label:
                label_renames[tmpl_label] = want
        else:
            # no source: delete the chip outright, or the template's own value shows
            omit_stats += [t['chip_values'][i], tmpl_label]
    if stat_pairs:
        reps['__STATS__'] = stat_pairs
    if omit_stats:
        reps.setdefault('__OMIT_STATS__', []).extend(omit_stats)
    for k, v in label_renames.items():
        reps[k] = v

    # spec rows -> slots
    cols = d.get('columns') or {}
    left_rows = [r for sec in cols.get('left', []) for r in sec.get('rows', [])]
    right_rows = [r for sec in cols.get('right', []) for r in sec.get('rows', [])]
    # drop mis-parsed rows (label is actually a value) before they reach the sheet
    left_rows = [r for r in left_rows if not looks_like_value(r.get('label'))]
    right_rows = [r for r in right_rows if not looks_like_value(r.get('label'))]

    def place(rows, slots, seen=None, seen_vals=None):
        """Match each row to the best slot; returns {slot: (label, value)}.

        `seen` carries (label, value) pairs already placed so a payload that lists
        the same spec in both columns does not print it twice.
        """
        taken, out = set(), {}
        seen = seen if seen is not None else set()
        seen_values = seen_vals if seen_vals is not None else set()
        for slot in slots:
            alias = ROW_ALIASES.get(slot, [])
            for r in rows:
                if id(r) in taken:
                    continue
                key = (norm(r.get('label', '')), norm_value(r.get('value')))
                if norm(r.get('label', '')) in alias and key not in seen and norm_value(r.get('value')) not in seen_values:
                    taken.add(id(r))
                    seen.add(key)
                    seen_values.add(norm_value(r.get('value')))
                    out[slot] = (dash(r.get('label', '')).strip(), clean(r.get('value', ''), 74))
                    break
        # leftovers fill whatever slots remain, in source order
        rest = [r for r in rows if id(r) not in taken]
        for slot in slots:
            if slot in out or not rest:
                continue
            r = rest.pop(0)
            key = (norm(r.get('label', '')), norm_value(r.get('value')))
            if key in seen or norm_value(r.get('value')) in seen_values:
                continue
            seen.add(key)
            seen_values.add(norm_value(r.get('value')))
            out[slot] = (dash(r.get('label', '')).strip(), clean(r.get('value', ''), 74))
        return out

    seen_vals = set()
    fill_left = place(left_rows, t['left_slots'], seen_vals=seen_vals)
    fill_right = place(right_rows, t['right_slots'], seen_vals=seen_vals)
    # spill left overflow into unused right slots before dropping anything
    spill = [r for r in left_rows if not any(v[0] == dash(r.get('label','')).strip() for v in fill_left.values())]
    for slot in t['right_slots']:
        if slot in fill_right or not spill:
            continue
        r = spill.pop(0)
        fill_right[slot] = (dash(r.get('label','')).strip(), clean(r.get('value',''), 74))

    row_pairs, omit, renames = {}, [], {}
    for slot, (label, value) in {**fill_left, **fill_right}.items():
        row_pairs[slot] = value
        if label and label != slot:
            renames[slot] = label
    for slot in t['left_slots'] + t['right_slots']:
        if slot not in row_pairs:
            omit.append(slot)
    omit.append('UGR')          # always: its value was deleted, so the label is orphaned
    if row_pairs:
        reps['__ROWS__'] = row_pairs
    if omit:
        reps.setdefault('__OMIT__', []).extend(omit)

    # applications -> the three tag positions
    apps = [clean(a, 24).upper() for a in (d.get('applications') or [])][:3]
    for i, tag in enumerate(t['app_tags']):
        if i < len(apps) and apps[i] != tag:
            reps[tag] = apps[i]
        elif i >= len(apps):
            reps.setdefault('__OMIT__', []).append(tag)

    # NOTE: a row omitted here leaves its rule behind. Every template draws the rule
    # for each spec row on the slide LAYOUT, which Keynote's AppleScript cannot reach,
    # and shapes made with "make new shape" are not reliably addressable (position
    # reads back as garbage, fill properties are rejected), so they cannot be painted
    # over from here. This needs a template whose layout carries no per-row rules, or
    # one whose row count matches the data.

    # rename row labels last: plain replacements run after __ROWS__ in the generator.
    # Start from the row renames, then fold in whatever plain pairs were added above
    # (chip labels, application tags), and order the lot so none cascades.
    all_renames = dict(renames)
    for k, v in reps.items():
        if not k.startswith('__'):
            all_renames[k] = v
    for k in list(all_renames):
        reps.pop(k, None)
    for src, dst in order_renames(all_renames):
        reps[src] = dst

    reps['__OMIT_TABLE__'] = True
    return reps


def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or None
    made = 0
    for f in sorted(os.listdir(DATA)):
        if not f.endswith('.json'):
            continue
        slug = f[:-5]
        if only and slug not in only:
            continue
        reps = build(slug)
        if reps is None:
            continue
        # drop the table flag when the template has none
        reps.pop('__OMIT_TABLE__', None)
        # de-duplicate the omit list
        if '__OMIT__' in reps:
            seen, uniq = set(), []
            for x in reps['__OMIT__']:
                if x not in seen:
                    seen.add(x); uniq.append(x)
            reps['__OMIT__'] = uniq
        json.dump(reps, open(os.path.join(OUT, f'{slug}.json'), 'w'), indent=1)
        made += 1
    print(f'wrote {made} replacement maps to scripts/examples/generated/')


if __name__ == '__main__':
    main()
