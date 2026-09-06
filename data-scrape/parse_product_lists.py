#!/usr/bin/env python3
"""Parse product-lists/*.csv (semicolon-delimited Numbers exports) into a master product list.

Output: master_products.json — one entry per data row that has an http(s) link.
Fields: category (sheet title from row 0), file, supplier, name, lumenx (LumenX Name when present),
        url (normalized), and whether the link looks like a product page, category page, or pdf.
"""
import csv, glob, json, os, re
from urllib.parse import urlsplit, urlunsplit
from collections import Counter

ROOT = os.path.dirname(os.path.abspath(__file__))
LISTDIR = os.path.join(ROOT, 'product-lists')


def norm_url(u: str) -> str:
    u = u.strip()
    parts = urlsplit(u)
    if parts.query:
        keep = []
        for kv in parts.query.split('&'):
            k = kv.split('=')[0].strip()
            if k in ('_pos', '_sid', '_ss', 'searchparam', 'searchcat', 'listtype', 'varselid', 'cnid', 'anid', 'cl', 'lang'):
                continue
            keep.append(kv)
        parts = parts._replace(query='&'.join(keep))
    return urlunsplit(parts)


def classify(u: str):
    path = urlsplit(u).path.lower()
    if path.endswith('.pdf'):
        return 'pdf'
    host = urlsplit(u).netloc.lower()
    if 'ledsc4.com' in host or 'kinglong-lighting.net' in host:
        return 'product' if ('/products/' in path or re.search(r'-[0-9]{4,6}$', path.rstrip('/'))) else 'product'
    if 'steinel.de' in host:
        return 'product'
    if 'superlume' in host:
        if 'product-page' in path:
            return 'product'
        return 'category'
    if 'pioledlighting' in host:
        if '/product-category/' in path:
            return 'category'
        return 'product'
    if '/products/' in path or '/product/' in path:
        return 'product'
    if 'category' in path or '/shop' in path:
        return 'category'
    return 'other'


def main():
    rows_all = []
    for f in sorted(glob.glob(os.path.join(LISTDIR, '*.csv'))):
        base = os.path.basename(f)
        with open(f, newline='', encoding='utf-8-sig') as fh:
            raw = list(csv.reader(fh, delimiter=';'))
        rows = [r for r in raw if any((c or '').strip() for c in r)]
        if not rows:
            continue
        title = rows[0][0].strip() or base.replace('-Table 1.csv', '').strip()
        hdr = [h.strip() for h in rows[1]] if len(rows) > 1 else []
        has_lumenx = (hdr[2] if len(hdr) > 2 else '')
        file_cat = base.replace('-Table 1.csv', '').strip()
        for r in rows[2:]:
            cells = [(c or '').strip() for c in r]
            if not cells or all(not c for c in cells):
                continue

            def isurl(c):
                return c.startswith('http') or c.startswith('file://')

            if len(cells) >= 3 and not cells[0] and not isurl(cells[1]) and not any(isurl(c) for c in cells[2:]):
                continue
            supplier = cells[0] if len(cells) > 0 and not isurl(cells[0]) else ''
            name = cells[1] if len(cells) > 1 and not isurl(cells[1]) else ''
            urls = [c for c in cells if isurl(c)]
            if not (supplier or name or urls):
                continue
            lumenx = ''
            if has_lumenx and len(cells) > 2 and not isurl(cells[2]):
                lumenx = cells[2]
            http_urls = [u for u in urls if u.startswith('http')]
            url = norm_url(http_urls[0]) if http_urls else ''
            kind = classify(url) if url else 'none'
            rows_all.append({
                'file': base,
                'category': title,
                'file_category': file_cat,
                'supplier': supplier,
                'name': name,
                'lumenx': lumenx,
                'url': url,
                'kind': kind,
            })

    out = os.path.join(ROOT, 'master_products.json')
    with open(out, 'w') as fh:
        json.dump(rows_all, fh, indent=1)
    print('rows:', len(rows_all))
    print(Counter(r['kind'] for r in rows_all))
    print('no url rows:', sum(1 for r in rows_all if not r['url']))
    print('wrote', out)


if __name__ == '__main__':
    main()
