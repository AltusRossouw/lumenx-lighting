#!/usr/bin/env python3
"""Pull the product URLs out of the master product list.

`Product List 2.numbers` is a Numbers bundle. Its content lives in Index.zip as
IWA files: snappy-compressed protobuf. Numbers is not installed on this machine
and python-snappy is not available, so this does the two steps it needs by hand —
a raw snappy decoder, then a scan for URLs in the decompressed bytes.

That is enough for the one column we want. It is not a general .numbers reader:
without the protobuf schema the surrounding table structure is guesswork, which is
why only strings come out.

    python3 scripts/extract-numbers-urls.py <bundle> [--dump]
"""
import io
import re
import sys
import zipfile


def snappy_decompress(data: bytes) -> bytes:
    """Raw snappy (the format IWA uses), header length included."""
    pos = 0
    shift = 0
    length = 0
    while True:
        byte = data[pos]
        pos += 1
        length |= (byte & 0x7F) << shift
        if not byte & 0x80:
            break
        shift += 7

    out = bytearray()
    while pos < len(data):
        tag = data[pos]
        pos += 1
        kind = tag & 0x03

        if kind == 0:                                     # literal
            size = tag >> 2
            if size < 60:
                size += 1
            else:
                extra = size - 59
                size = int.from_bytes(data[pos:pos + extra], 'little') + 1
                pos += extra
            out += data[pos:pos + size]
            pos += size
            continue

        if kind == 1:                                     # copy, 1-byte offset
            size = ((tag >> 2) & 0x07) + 4
            offset = ((tag >> 5) << 8) | data[pos]
            pos += 1
        elif kind == 2:                                   # copy, 2-byte offset
            size = (tag >> 2) + 1
            offset = int.from_bytes(data[pos:pos + 2], 'little')
            pos += 2
        else:                                             # copy, 4-byte offset
            size = (tag >> 2) + 1
            offset = int.from_bytes(data[pos:pos + 4], 'little')
            pos += 4

        if offset == 0 or offset > len(out):
            break
        start = len(out) - offset
        for i in range(size):
            out.append(out[start + i])

    return bytes(out[:length]) if length else bytes(out)


def iwa_chunks(blob: bytes):
    """Split an IWA file into its snappy blocks.

    Each block is a version byte (0), a 3-byte little-endian length, then that
    many bytes of snappy. Reading it as a 4-byte length instead — the obvious
    guess — gives values larger than the whole file and yields nothing at all.
    """
    pos = 0
    while pos + 4 <= len(blob):
        size = int.from_bytes(blob[pos + 1:pos + 4], 'little')
        pos += 4
        if size <= 0 or pos + size > len(blob):
            break
        yield blob[pos:pos + size]
        pos += size


def strings_from(bundle_path: str):
    with zipfile.ZipFile(f'{bundle_path}/Index.zip') as zf:
        for name in zf.namelist():
            if not name.endswith('.iwa'):
                continue
            raw = zf.read(name)
            for chunk in iwa_chunks(raw):
                try:
                    text = snappy_decompress(chunk)
                except Exception:                          # noqa: BLE001
                    continue
                yield name, text


URL = re.compile(rb'https?://[A-Za-z0-9\-._~:/?#\[\]@!$&\'()*+,;=%]{6,200}')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    bundle = sys.argv[1]
    dump = '--dump' in sys.argv

    found = {}
    for name, text in strings_from(bundle):
        for m in URL.finditer(text):
            url = m.group(0).decode('utf-8', 'replace').rstrip('.,;)')
            found.setdefault(url, name)

    print(f'  {len(found)} distinct URLs\n')
    for url in sorted(found):
        print(f'    {url}')
    if dump:
        import json
        out = '/tmp/lx/numbers-urls.json'
        with open(out, 'w') as fh:
            json.dump(sorted(found), fh, indent=2)
        print(f'\n  written to {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
