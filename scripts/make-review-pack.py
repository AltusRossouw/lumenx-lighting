#!/usr/bin/env python3
"""Build a visual review pack for the published catalogue.

One row per product: the tile that fronts it on the site, then every gallery
image behind it. Grouped by category so placements can be checked at a glance.

    python3 scripts/make-review-pack.py [output-dir]

Writes one PNG per category plus a combined PDF.
"""
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(os.path.expanduser('~'), 'Documents', 'catalogue-review')

THUMB_H = 120          # gallery thumb height
TILE_W, TILE_H = 214, 120
PAD = 10
LABEL_W = 260
ROW_H = TILE_H + PAD
PER_PAGE = 6

BG = (16, 16, 20)
ROW_BG = (24, 24, 30)
INK = (232, 232, 236)
DIM = (150, 150, 158)
ACCENT = (0, 212, 255)


def font(size, bold=False):
    for name in (('Arial Bold.ttf', 'Arial.ttf') if bold else ('Arial.ttf',)):
        try:
            return ImageFont.truetype(f'/System/Library/Fonts/Supplemental/{name}', size)
        except Exception:                                 # noqa: BLE001
            continue
    return ImageFont.load_default()


def load_products():
    """Every published product with its category, name, tile and gallery."""
    off = open(os.path.join(ROOT, 'src', 'official-products.ts')).read()
    src = open(os.path.join(ROOT, 'src', 'catalogue-scraped.ts')).read()

    # scraped records: category, slug, name, hero, gallery
    scraped = {}
    for m in re.finditer(
            r'\n  \{\n    slug: "([^"]+)",\n    name: "([^"]+)",\n    category: "([^"]+)",(.*?)\n  \},',
            src, re.S):
        slug, name, cat, body = m.groups()
        hero = re.search(r'imageUrl: "([^"]+)"', body)
        gallery = re.findall(r'\{ src: "([^"]+)"', body)
        scraped[f'{cat}/{slug}'] = {
            'category': cat, 'slug': slug, 'name': name,
            'hero': hero.group(1) if hero else None, 'gallery': gallery,
        }

    consumed = set()
    for m in re.finditer(r"fromScraped\(\s*'([^']+)',\s*'([^']+)'", off):
        consumed.add(f'{m.group(1)}/{m.group(2)}')

    out = []

    # curated products first
    for m in re.finditer(r'createOfficialProduct\(\{(.*?)\n  \}\),', off, re.S):
        b = m.group(1)
        slug = re.search(r"slug: '([^']+)'", b)
        cat = re.search(r"category: '([^']+)'", b)
        name = re.search(r"name: '([^']+)'", b)
        img = re.search(r"image: '([^']+)'", b)
        if not (slug and cat and name):
            continue
        tile = f'public/product-images/tiles/{cat.group(1)}/{slug.group(1)}.jpg'
        gallery = [img.group(1)] if img else []
        out.append({'category': cat.group(1), 'slug': slug.group(1),
                    'name': name.group(1), 'tile': tile, 'gallery': gallery})

    for m in re.finditer(r"fromScraped\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'(.*?)\),\n", off, re.S):
        cat, scraped_slug, name, rest = m.groups()
        pub = re.search(r"publicSlug: '([^']+)'", rest)
        slug = pub.group(1) if pub else scraped_slug
        tile = f'public/product-images/tiles/{cat}/{slug}.jpg'
        hero = re.search(r"hero: '([^']+)'", rest)
        gallery = [hero.group(1)] if hero else []
        gallery += re.findall(r"\{ src: '([^']+)'", rest)
        # fall back to the scraped gallery when the curated entry lists none
        if len(gallery) < 2 and f'{cat}/{scraped_slug}' in scraped:
            gallery += scraped[f'{cat}/{scraped_slug}']['gallery']
        out.append({'category': cat, 'slug': slug, 'name': name, 'tile': tile, 'gallery': gallery})

    # everything else straight from the scrape
    for key, rec in scraped.items():
        if key in consumed:
            continue
        cat, slug = key.split('/', 1)
        tile = f'public/product-images/tiles/{cat}/{slug}.jpg'
        out.append({'category': cat, 'slug': slug, 'name': rec['name'],
                    'tile': tile, 'gallery': rec['gallery']})

    return out


def resolve(p):
    if not p:
        return None
    full = p if p.startswith('public/') else 'public' + p
    return full if os.path.exists(full) else None


def fit(im, w, h, bg=(255, 255, 255)):
    """Letterbox into a white box, the way the product page shows them."""
    im = im.convert('RGB')
    r = min(w / im.width, h / im.height)
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    box = Image.new('RGB', (w, h), bg)
    box.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
    return box


def build(products, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    by_cat = {}
    for p in products:
        by_cat.setdefault(p['category'], []).append(p)

    titles = dict(re.findall(
        r'^    id: "([a-z0-9-]+)",\n    title: "([^"]+)"',
        open(os.path.join(ROOT, 'src', 'catalogue-scraped.ts')).read(), re.M))

    pages = []
    total = 0
    for cat in sorted(by_cat):
        items = by_cat[cat]
        total += len(items)
        for start in range(0, len(items), PER_PAGE):
            chunk = items[start:start + PER_PAGE]
            # widest gallery on this page decides the width
            cols = max(len([g for g in c['gallery'] if resolve(g)]) for c in chunk)
            width = LABEL_W + TILE_W + PAD + max(1, cols) * (THUMB_H + PAD) + PAD + 40
            height = 74 + len(chunk) * ROW_H + PAD
            sheet = Image.new('RGB', (width, height), BG)
            d = ImageDraw.Draw(sheet)

            d.text((PAD, 14), titles.get(cat, cat), fill=INK, font=font(22, True))
            d.text((PAD, 44), f'{len(items)} products   ·   page {start // PER_PAGE + 1}',
                   fill=DIM, font=font(13))

            for i, c in enumerate(chunk):
                y = 74 + i * ROW_H
                d.rectangle([0, y, width, y + ROW_H - PAD + 2], fill=ROW_BG)
                d.text((PAD, y + 12), c['name'][:34], fill=INK, font=font(15, True))
                d.text((PAD, y + 34), c['slug'][:36], fill=DIM, font=font(12))
                d.text((PAD, y + 52), 'HERO →', fill=ACCENT, font=font(10))

                tile = resolve(c['tile'])
                x = LABEL_W
                if tile:
                    sheet.paste(Image.open(tile).convert('RGB').resize((TILE_W, TILE_H), Image.LANCZOS), (x, y))
                else:
                    d.rectangle([x, y, x + TILE_W, y + TILE_H], fill=(60, 20, 20))
                    d.text((x + 8, y + 50), 'NO TILE', fill=(255, 120, 120), font=font(12))
                x += TILE_W + PAD

                for g in c['gallery']:
                    gp = resolve(g)
                    if not gp:
                        continue
                    sheet.paste(fit(Image.open(gp), THUMB_H, THUMB_H), (x, y))
                    x += THUMB_H + PAD

            path = os.path.join(out_dir, f'{cat}-{start // PER_PAGE + 1}.png')
            sheet.save(path)
            pages.append(path)

    return pages, total


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    products = load_products()
    pages, total = build(products, out_dir)
    print(f'  {total} products across {len(set(p["category"] for p in products))} categories')
    print(f'  {len(pages)} pages written to {out_dir}')


if __name__ == '__main__':
    main()
