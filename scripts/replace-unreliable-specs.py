#!/usr/bin/env python3
"""Replace spec values that are several variants mashed together.

The scraper read category spec tables, where one row per SKU, and joined every
row's value with " / ". The result is on the product pages and in the
datasheets: Bazuka lists eight wattages for one fitting, and its Lumen Output
field carries a Power Factor, an efficacy figure and a beam angle.

Guessing which SKU a page represents would be inventing a specification, so the
unreliable values are replaced with a request to ask instead.

Not every multi-value field is a mash. A range of sizes, a set of CCT options, a
list of certifications and a set of beam angles are all legitimately plural, so
the rule distinguishes by shape:

* a SCALAR field (one product has one wattage, one IP rating, one voltage) is
  unreliable as soon as it holds more than one value;
* any other field is unreliable when its values are HETEROGENEOUS -- when some
  carry a unit or a digit and others do not, which is what mixing a colour, a
  material and a finish into "Housing" looks like.

    python3 scripts/replace-unreliable-specs.py --dry-run
    python3 scripts/replace-unreliable-specs.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPLACEMENT = 'Contact our team for more details'

# One product has one of these. Two values means two SKUs were joined.
SCALAR = {
    'wattage', 'power', 'lumen output', 'lumens', 'luminous flux', 'ip rating',
    'ik rating', 'input voltage', 'operating temp', 'operating temperature',
    'surge protection', 'cri', 'power factor', 'dimmable', 'efficacy',
    'luminous efficacy', 'driver', 'lifetime', 'warranty',
}

# Plural by nature: a fitting really can be certified to several standards, be
# offered in several sizes, or mount two ways. These are left alone however many
# values they carry, as long as the values are all the same kind of thing.
LIST_FIELDS = {
    'certifications', 'dimensions', 'mounting', 'mounting type', 'type',
    'application', 'applications', 'functions', 'colour temperature', 'cct',
    'options', 'configurations', 'beam angle', 'sphere diameter options',
    'cluster configurations', 'available in',
}

SEP = re.compile(r'\s+/\s+')


def segments(value):
    return [s.strip() for s in SEP.split(str(value)) if s.strip()]


def shape(seg):
    """A crude fingerprint: does it carry a digit, and does it carry a unit?"""
    return (bool(re.search(r'\d', seg)), bool(re.search(r'[a-zA-Z]', seg)))


def unreliable(label, value):
    segs = segments(value)
    if len(segs) < 2:
        return False
    name = str(label).strip().lower()
    if name in SCALAR:
        return True
    # A value that repeats one of its own alternatives is a merge, whichever
    # field it is in: "3CCT (3000K/4000K/6000K) / 3000K / 3CCT(3000K/4000K/6000K)".
    flat = [re.sub(r'[^a-z0-9]', '', s.lower()) for s in segs]
    if len(flat) != len(set(flat)):
        return True
    if name in LIST_FIELDS:
        return False
    # Everything else should hold one value. A shape test alone missed
    # "Aluminium / Round, Square / CNC / Glass", which is all bare nouns.
    return True


def scan_ts(path):
    src = open(path).read()
    hits = []
    for m in re.finditer(r'\{ label: "([^"]*)", value: "([^"]*)" \}', src):
        if unreliable(m.group(1), m.group(2)):
            hits.append((m.group(1), m.group(2)))
    return hits


def scan_json(path):
    d = json.load(open(path))
    hits = []
    for st in d.get('stats') or []:
        if unreliable(st.get('label'), st.get('value')):
            hits.append((st.get('label'), st.get('value')))
    for col in (d.get('columns') or {}).values():
        for sec in (col or []):
            for row in (sec.get('rows') or []):
                if unreliable(row.get('label'), row.get('value')):
                    hits.append((row.get('label'), row.get('value')))
    return hits


def main():
    dry = '--dry-run' in sys.argv
    ts = os.path.join(ROOT, 'src', 'catalogue-scraped.ts')
    data = os.path.join(ROOT, 'server', 'datasheets-data')

    ts_hits = scan_ts(ts)
    print(f'src/catalogue-scraped.ts: {len(ts_hits)} unreliable spec values')

    from collections import Counter
    by_label = Counter(l for l, _ in ts_hits)
    for label, n in by_label.most_common():
        print(f'    {label:24} {n}')

    slugs, json_total = [], 0
    for f in sorted(os.listdir(data)):
        if not f.endswith('.json'):
            continue
        h = scan_json(os.path.join(data, f))
        if h:
            slugs.append(f[:-5])
            json_total += len(h)
    print(f'\nserver/datasheets-data: {json_total} values across {len(slugs)} payloads')

    if dry:
        print('\n--- a sample of what would be replaced ---')
        for label, value in ts_hits[:10]:
            print(f'    {label:22} {value[:66]}')
        print('\n(dry run -- nothing written)')
        return

    # catalogue-scraped.ts
    src = open(ts).read()
    def sub(m):
        label, value = m.group(1), m.group(2)
        if unreliable(label, value):
            return '{ label: "%s", value: "%s" }' % (label, REPLACEMENT)
        return m.group(0)
    open(ts, 'w').write(re.sub(r'\{ label: "([^"]*)", value: "([^"]*)" \}', sub, src))

    # datasheet payloads
    for f in sorted(os.listdir(data)):
        if not f.endswith('.json'):
            continue
        p = os.path.join(data, f)
        d = json.load(open(p))
        changed = False
        for st in d.get('stats') or []:
            if unreliable(st.get('label'), st.get('value')):
                st['value'] = REPLACEMENT; st['unit'] = ''; changed = True
        for col in (d.get('columns') or {}).values():
            for sec in (col or []):
                for row in (sec.get('rows') or []):
                    if unreliable(row.get('label'), row.get('value')):
                        row['value'] = REPLACEMENT; changed = True
        if changed:
            json.dump(d, open(p, 'w'), indent=2, ensure_ascii=False)

    print('\nwritten. run with --dry-run to preview again.')


if __name__ == '__main__':
    main()
