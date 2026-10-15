#!/usr/bin/env python3
"""Make image files' extensions tell the truth about their contents.

The scraper saved WebP and AVIF payloads under .jpg and .png names: 162 files.
Browsers mostly cope by content sniffing, which is why nothing looked wrong, but
anything that trusts the extension does not. That includes this project's own
serve path, which sets X-Content-Type-Options: nosniff on some routes -- there a
WebP sent as image/jpeg can be refused outright rather than rendered.

Renames each file to its real format and rewrites every reference. Renaming is
lossless and, unlike re-encoding, does not turn a 4499px decorative WebP into a
multi-megabyte PNG.

    python3 scripts/fix-mislabelled-images.py --dry-run
    python3 scripts/fix-mislabelled-images.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENCE_FILES = ['src/catalogue-scraped.ts', 'src/official-products.ts',
                   'scripts/make-product-tiles.py']
SCAN_ROOTS = ['public/scraped', 'public/product-images']
EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif')


def sniff(head):
    if head[4:12] in (b'ftypavif', b'ftypavis') or head[8:12] == b'avif':
        return 'avif'
    if head[4:12] == b'ftypheic' or head[8:12] in (b'heic', b'heix', b'mif1'):
        return 'heic'
    if head.startswith(b'\xff\xd8'):
        return 'jpg'
    if head.startswith(b'\x89PNG'):
        return 'png'
    if head.startswith(b'GIF8'):
        return 'gif'
    if head.startswith(b'BM'):
        return 'bmp'
    if head.startswith(b'RIFF') and head[8:12] == b'WEBP':
        return 'webp'
    return None


def scan():
    out = []
    for root in SCAN_ROOTS:
        for dirpath, _dirs, files in os.walk(os.path.join(ROOT, root)):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext not in EXTS:
                    continue
                p = os.path.join(dirpath, f)
                try:
                    with open(p, 'rb') as fh:
                        head = fh.read(32)
                except OSError:
                    continue
                got = sniff(head)
                if got and got != ext.lstrip('.'):
                    out.append((p, got))
    return out


def main():
    dry = '--dry-run' in sys.argv
    found = scan()
    print(f'{len(found)} files whose extension does not match their contents\n')
    kinds = {}
    for p, got in found:
        kinds[got] = kinds.get(got, 0) + 1
    for k, n in sorted(kinds.items(), key=lambda kv: -kv[1]):
        print(f'   {n:4} are really {k}')
    print()
    for p, got in found[:8]:
        print(f'   {os.path.relpath(p, ROOT)}  ->  .{got}')
    if len(found) > 8:
        print(f'   ... and {len(found) - 8} more')

    if dry:
        print('\n(dry run -- nothing renamed)')
        return

    renames = []
    for p, got in found:
        base, ext = os.path.splitext(p)
        target = f'{base}.{got}'
        if os.path.exists(target):
            print(f'   SKIP {os.path.relpath(p, ROOT)}: {os.path.basename(target)} already exists')
            continue
        os.rename(p, target)
        renames.append((p, target))

    # Rewrite every reference, longest path first so a shorter name cannot
    # partially match inside a longer one.
    renames.sort(key=lambda r: -len(r[0]))
    for rel in REFERENCE_FILES:
        f = os.path.join(ROOT, rel)
        if not os.path.exists(f):
            continue
        src = open(f).read()
        before = src
        for old, new in renames:
            o = '/' + os.path.relpath(old, os.path.join(ROOT, 'public')).replace(os.sep, '/')
            n = '/' + os.path.relpath(new, os.path.join(ROOT, 'public')).replace(os.sep, '/')
            src = src.replace('"' + o + '"', '"' + n + '"')
            src = src.replace("'" + o + "'", "'" + n + "'")
            src = src.replace(o, n)
        if src != before:
            open(f, 'w').write(src)
            print(f'   updated references in {rel}')

    print(f'\nrenamed {len(renames)} files')


if __name__ == '__main__':
    main()
