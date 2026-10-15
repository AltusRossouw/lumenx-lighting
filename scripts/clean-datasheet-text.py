#!/usr/bin/env python3
"""Fix the text faults that show up on the generated datasheets.

`scripts/normalise-datasheet-payloads.py` removes duplicated rows; this pass
fixes the words themselves. Everything here was found by reading the rendered
PDFs, and each rule names the sheet it came from:

  * a trailing backslash left by the supplier scrape — "Black/White \\" on Hero,
    "25W = 3000lm \\" on Sauron;
  * two specs crammed into one cell — Blaster's colour-temperature value carried
    a whole lumen line behind it ("... (3000K/4000K/6000K) Lumen Output:28W =
    >3220lm");
  * "Contact our team for more details" standing in for a specification 143
    times over 38 products. A finished spec sheet should not read like a
    placeholder, so the value becomes an em dash and a stat chip with nothing
    real to show is dropped;
  * supplier certification lists pasted together verbatim — "CE, EMC, IEC60598 /
    CE, EMC, RoHS / RoHS / CE / EMC, ErP, CE" on Kuda — split, de-duplicated and
    written one way;
  * a lumen range that starts at zero ("0–653 lm"), which is a scrape artefact,
    not a measurement;
  * units glued to the number ("12000lm") or missing altogether, and stat labels
    shouting in capitals ("LUMEN OUTPUT") while the rows beside them use title
    case.

Idempotent: running it twice changes nothing the second time.

    python3 scripts/clean-datasheet-text.py [--check] [slug ...]
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'server', 'datasheets-data')

# The placeholder string the scrape wrote in place of a specification.
PLACEHOLDER = re.compile(r'^\s*contact our team.*$', re.I | re.S)
DASH = '—'

# Legal and contact boilerplate for the payloads that were authored before it
# became standard. Copied verbatim from the template's own sample data.
DEFAULT_NOTES = [
    'E &amp; O.E (Errors And Omissions Excepted).',
    'Due to the rapid development in LED technology the performance values, power '
    'consumption and lumen output levels stated above are subject to change without '
    'prior notice.',
    'Due to the interoperability of LED modules and drivers, up to a 10% deviation in '
    'these values is possible.',
    'Nominal flux values are stated at 25° C, based on LED manufacturer’s data.',
    'Installation environmental conditions may impact the performance and efficiency of '
    'the luminaire.',
]
DEFAULT_CONTACT = {
    'web': 'www.lumenx.co.za',
    'email': 'info@lumenx.co.za',
    'phone': '+27 83 499 5340',
}

# ── labels ────────────────────────────────────────────────────────────────────
# Stat chips are set in an all-caps face by CSS, so the label text itself keeps
# the same title case the spec rows use.
STAT_LABEL_FIX = {
    'lumen output': 'Lumens',
    'lumens': 'Lumens',
    'power': 'Power',
    'wattage': 'Wattage',
    'ip rating': 'IP Rating',
    'cct': 'CCT',
    'colour temperature': 'Colour Temperature',
    'color temperature': 'Colour Temperature',
    'beam angle': 'Beam Angle',
    'fitting material': 'Fitting Material',
    'detection angle': 'Detection Angle',
    'colour': 'Colour',
    'material': 'Material',
    'installation': 'Installation',
    'length': 'Length',
}

# Spec-row labels that arrived in the supplier's lower case. Only labels whose
# proper form is unambiguous are listed, so nothing is re-cased by guesswork.
ROW_LABEL_FIX = {
    'available in': 'Available In',
    'includes': 'Includes',
    'length': 'Length',
    'lens': 'Lens',
    'manual override': 'Manual Override',
    'infrared sensor 360°': 'Infrared Sensor 360°',
    'max. 2000 w': 'Max. 2000 W',
    'operating temp': 'Operating Temp',
    'operating temperature': 'Operating Temperature',
    'rohs ies file': 'RoHS / IES File',
    'flicker free cri': 'Flicker-free CRI',
    'light source': 'Light Source',
    'led chips': 'LED Chips',
    'led colours (cct)': 'LED Colours (CCT)',
}

# ── values ────────────────────────────────────────────────────────────────────
# The sheets close the gap between a number and its unit: "12000lm", "35W",
# "220-265V", "-15 ~ 45°C", "Φ90 × 130mm". That is the house style the Keynote
# originals already use, so the cleaner normalises towards it — "12000 lm" and
# "35 W" both come out as "12000lm" and "35W", and one sheet no longer disagrees
# with the next. Only unambiguously unit-like tokens are listed: "m" and "g" are
# left alone because they are as likely to be the tail of a model name, and a
# bare "3000K" is left as written. The guard below keeps model codes such as
# "L80B10", "IP65", "O2" and "M8" intact.
UNIT_GLUE = re.compile(
    r'(\d[\d.,]*)\s*(lm|LM|Lm|lumens|W|w|kW|V|Hz|mm|cm|kg|hrs|hours|°C|kV)\b')
UNIT_CANON = {
    'lm': 'lm', 'LM': 'lm', 'Lm': 'lm', 'lumens': 'lm',
    'W': 'W', 'w': 'W', 'kW': 'kW',
    'V': 'V', 'Hz': 'Hz', 'mm': 'mm', 'cm': 'cm',
    'kg': 'kg', 'hrs': 'hrs', 'hours': 'hours',
    '°C': '°C', 'kV': 'kV',
}

# The scrape pasted the supplier's website chrome into spec values: a warranty
# banner and a download button, complete with the asterisk that linked them.
# "Flicker free AGT Driver *5 YEAR WARRANTY DOWNLOAD SPEC SHEET" is a feature,
# not a call to action, so the tail is cut.
WEB_CHROME = re.compile(
    r'\s*\*?\s*\d+\s*YEAR\s+WARRANTY\b.*$'
    r'|\s*\*?\s*DOWNLOAD\s+SPEC\s+SHEET\b.*$'
    r'|\s*\*?\s*5\s*YEAR\s+WARRANTY\b.*$', re.I)

# Lower-case "sq."/"rd." are the scrape's own abbreviations, cut off mid-word by
# the page it read them from.
ABBREV_FIX = (
    (re.compile(r'\bsq\.\s*$'), 'square'),
    (re.compile(r'\brd\.\s*$'), 'round'),
    (re.compile(r',\s*sq\.(?=\s|$)'), ', square'),
    (re.compile(r',\s*rd\.(?=\s|$)'), ', round'),
)

# Supplier-house prefixes that mean nothing to a LumenX reader.
LABEL_PREFIX = re.compile(r'^PU1,\s*', re.I)

# A numeric range and its separator. Both sides have to be whole numbers, so a
# decimal pair written with a comma ("2,5") is not mistaken for a range; the
# first number may carry its unit ("17W - 126W", "620mm - 3020mm").
NUMERIC_RANGE = re.compile(
    r'(\d+)((?:lm|W|w|kW|V|A|mm|cm|m|kg|g|Hz|kV|°C)?)\s*[–-]\s*(\d+)')

# Two specs pasted into one cell. The supplier page runs its spec table into a
# single line; split it back out rather than printing the paste.
JAMMED = re.compile(
    r'^(?P<first>.*?)\s*(?P<second_label>Lumen Output|Lumens?|Power|Wattage|CCT|'
    r'Colour Temperature)\s*:\s*(?P<second>.*)$', re.I | re.S)


def _close_unit(match):
    """Close the gap between a number and its unit — unless the number is the
    tail of a model code ("L80B10", "O2", "M8"), which must survive untouched."""
    start = match.start(1)
    if start > 0 and match.string[start - 1].isalnum():
        return match.group(0)
    return f'{match.group(1)}{UNIT_CANON.get(match.group(2), match.group(2))}'


def _close_range(match):
    """Set a numeric range with a single closed-up en dash — but leave a decimal
    pair ("2,5 - 4 m", in the metric notation the German suppliers use) as it is."""
    after = match.string[match.end(3):match.end(3) + 1]
    if after in (',', '.'):
        return match.group(0)
    return f'{match.group(1)}{match.group(2)}–{match.group(3)}'


def tidy_text(value):
    """Strip scrape debris and normalise spacing without touching meaning."""
    text = str(value)
    text = text.replace('\\', ' ')            # trailing scrape backslash
    text = WEB_CHROME.sub('', text)           # "… *5 YEAR WARRANTY DOWNLOAD SPEC SHEET"
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.strip(' \\')
    text = UNIT_GLUE.sub(_close_unit, text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Every numeric range is set the same way — one en dash, closed up:
    # "620mm - 3020mm", "17W - 126W" and "17W – 126W" all become "620mm–3020mm"
    # and "17W–126W". A pair that turns out to be a decimal ("2,5 - 4" in a
    # metric supplier's notation) is left alone.
    text = NUMERIC_RANGE.sub(_close_range, text)
    # The scrape glues a word to the following slash: "Voltage/ Frequency",
    # "V/ 50". A unit ratio ("lm/W") and a value list ("13W/18W") are left alone.
    text = re.sub(r'(?<=[A-Za-z])\s*/\s+(?=[A-Za-z])', ' / ', text)
    for pattern, replacement in ABBREV_FIX:
        text = pattern.sub(replacement, text)
    text = re.sub(r'\bCCT\'s\b', 'CCTs', text)
    text = re.sub(r'\s+([,.;])', r'\1', text)      # space before punctuation
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def tidy_certifications(value):
    """Rewrite a pasted supplier certification list as one clean list.

    Every sheet is a LumenX sheet, so the union of the range's approvals is what
    belongs in the row: "CE, EMC, IEC60598 / CE, EMC, RoHS / RoHS / CE / EMC,
    ErP, CE" is just "CE / EMC / IEC 60598 / RoHS / ErP". Order matters for
    readability, so it is kept as first seen rather than sorted.
    """
    text = str(value).replace(';', ',')
    text = re.sub(r'\bIEC\s*60958\b', 'IEC 60598', text)   # audio standard, not lighting
    text = re.sub(r'\bIEC\s*(\d{4,5})\b', r'IEC \1', text)
    parts = re.split(r'\s*/\s*|\s*,\s*|\s*\.\s+', text)
    out = []
    for part in parts:
        part = part.strip().strip('.,').strip()
        part = re.sub(r'\s+', ' ', part)
        if not part or part.lower() in ('msds', 'n/a'):
            continue
        part = re.sub(r'\bRoHS\b', 'RoHS', part, flags=re.I)
        part = re.sub(r'\bErP\b', 'ErP', part, flags=re.I)
        part = re.sub(r'\bEMC\b', 'EMC', part, flags=re.I)
        part = re.sub(r'\bIEC\b', 'IEC', part, flags=re.I)
        if part.upper() == 'CE':
            part = 'CE'
        if part not in out:
            out.append(part)
    return ' / '.join(out) if out else DASH


def tidy_lumen_range(value):
    """Drop a zero low end — "0–653 lm" is a scrape artefact, not a measurement."""
    text = str(value)
    fixed = re.sub(r'(?<![\d.,])0\s*[–-]\s*(?=\d)', '', text)
    return tidy_text(fixed)


def is_placeholder(value):
    return bool(PLACEHOLDER.match(str(value)))


def fix_stat(stat):
    """Fix one stat chip in place and say whether it is worth showing."""
    value = tidy_text(stat.get('value', ''))
    label = tidy_text(stat.get('label', ''))
    if is_placeholder(value):
        return None                      # nothing real to show
    value = tidy_lumen_range(value)
    if value in ('', DASH, '-'):
        return None
    unit = tidy_text(stat.get('unit', '') or '')
    # The value sometimes already carries its unit; do not print it twice.
    if unit and value.lower().endswith(unit.lower()):
        value = value[: -len(unit)].strip()
    stat['label'] = STAT_LABEL_FIX.get(label.lower(), label)
    stat['value'] = value
    stat['unit'] = unit
    return stat


def fix_row(row):
    """Fix one spec row. Returns the row, or None when there is nothing to show."""
    label = LABEL_PREFIX.sub('', tidy_text(row.get('label', '')))
    value = tidy_text(row.get('value', ''))
    label = ROW_LABEL_FIX.get(label.lower(), label)

    if is_placeholder(value):
        value = DASH

    if 'certif' in label.lower() or label.lower() in ('standards', 'electrical safety'):
        value = tidy_certifications(value)

    # A lumen or wattage row quoting a range that starts at zero.
    if re.search(r'lumen|flux|output', label, re.I) and re.search(r'\b0\s*[–-]\s*\d', value):
        value = tidy_lumen_range(value)

    # A trailing dash on a value that also lists variants reads as unfinished.
    value = re.sub(r'\s*/\s*$', '', value).strip()
    if value in ('', DASH) and label.lower() in ('certifications',):
        value = DASH

    row['label'] = label
    row['value'] = value
    return row


def split_jammed(payload):
    """Rebuild a stat that swallowed the next spec line.

    Blaster's colour-temperature chip arrived as "3CCT (3000K/4000K/6000K)
    Lumen Output:28W = >3220lm". The lumen half belongs in its own row.
    """
    stats = payload.get('stats') or []
    additions = []
    for stat in stats:
        if not isinstance(stat, dict):
            continue
        match = JAMMED.match(str(stat.get('value', '')))
        if not match:
            continue
        first = match.group('first').strip(' ,;/-')
        second_label = match.group('second_label')
        second = match.group('second').strip(' ,;/\\')
        if not first or not second:
            continue
        stat['value'] = first
        additions.append({
            'label': STAT_LABEL_FIX.get(second_label.lower(), second_label),
            'value': second,
            'unit': '',
        })
    if additions:
        stats.extend(additions)
        payload['stats'] = stats
    return payload


def dedupe_stats(stats):
    """Drop a chip that repeats the label of the chip before it.

    Legend carried both "Power 10–35 W" and "Wattage —"; a sheet with the same
    quantity printed twice under two names reads as an error.
    """
    seen_labels = set()
    out = []
    for stat in stats:
        key = re.sub(r'[^a-z]', '', str(stat.get('label', '')).lower())
        canon = {'wattage': 'power', 'lumens': 'lumenoutput', 'lumen': 'lumenoutput',
                 'cct': 'colourtemperature'}.get(key, key)
        if canon in seen_labels:
            continue
        seen_labels.add(canon)
        out.append(stat)
    return out


def ensure_boilerplate(payload):
    """Put the legal notes and the contact line back on every sheet.

    Ten of the older payloads ship without them, so their datasheets render a
    bare logo where the disclaimer and the contact strip belong. The wording is
    the same one the other 114 payloads carry, taken from the template's own
    sample data.
    """
    if not payload.get('notes'):
        payload['notes'] = list(DEFAULT_NOTES)
    if not payload.get('contact'):
        payload['contact'] = dict(DEFAULT_CONTACT)
    return payload


def clean(payload):
    payload = split_jammed(payload)

    fixed = []
    for stat in payload.get('stats') or []:
        if not isinstance(stat, dict):
            continue
        result = fix_stat(stat)
        if result is not None:
            fixed.append(result)
    payload['stats'] = dedupe_stats(fixed)

    columns = payload.get('columns') or {}
    for side in ('left', 'right'):
        sections = []
        for section in columns.get(side) or []:
            rows = []
            for row in section.get('rows') or []:
                if not isinstance(row, dict):
                    continue
                rows.append(fix_row(row))
            rows = [r for r in rows if r is not None]
            if rows:
                section = dict(section)
                section['rows'] = rows
                sections.append(section)
        columns[side] = sections
    payload['columns'] = columns

    if payload.get('variant'):
        payload['variant'] = tidy_text(payload['variant'])
    payload['overview'] = [tidy_text(p) for p in payload.get('overview') or []]
    payload['features'] = [tidy_text(f) for f in payload.get('features') or []]
    return ensure_boilerplate(payload)


def main():
    check = '--check' in sys.argv
    named = [a for a in sys.argv[1:] if not a.startswith('--')]
    files = sorted(glob.glob(os.path.join(DATA, '*.json')))
    if named:
        files = [f for f in files if os.path.basename(f)[:-5] in named]

    changed = 0
    for path in files:
        with open(path) as handle:
            original = json.load(handle)
        updated = clean(json.loads(json.dumps(original)))
        if updated == original:
            continue
        changed += 1
        if not check:
            with open(path, 'w') as handle:
                json.dump(updated, handle, indent=2, ensure_ascii=False)
                handle.write('\n')

    verb = 'would change' if check else 'cleaned'
    print(f'  {verb} {changed} of {len(files)} payloads')


if __name__ == '__main__':
    main()
