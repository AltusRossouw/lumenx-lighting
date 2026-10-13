#!/usr/bin/env python3
"""Pull a supplier product image through headless Chrome, then trim the letterbox.

Some supplier CDNs answer curl with a 403 but serve a browser normally, so the
image is fetched by pointing Chrome at it and capturing the render. Chrome
centres the image on a dark backdrop, which is trimmed off by finding the
non-backdrop bounds.

    python3 scripts/fetch-supplier-image.py <url> <output.png>
"""
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')


def fetch(url: str, out: str, window: tuple[int, int] = (1400, 1400)) -> bool:
    with tempfile.TemporaryDirectory() as tmp:
        shot = os.path.join(tmp, 'shot.png')
        subprocess.run([
            CHROME, '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
            f'--user-agent={UA}', '--virtual-time-budget=25000',
            f'--window-size={window[0]},{window[1]}',
            f'--screenshot={shot}', url,
        ], capture_output=True, timeout=180)
        if not os.path.exists(shot):
            return False
        im = Image.open(shot).convert('RGB')

    a = np.array(im).astype(int)
    # Chrome pads with a flat backdrop; the image is whatever differs from the
    # corner colour. Corners are the backdrop by construction.
    bg = a[2, 2]
    diff = np.abs(a - bg).sum(axis=2)
    ys, xs = np.where(diff > 24)
    if not len(xs):
        return False
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    # a 1px border can survive the threshold; drop it
    im.crop((x0 + 1, y0 + 1, x1, y1)).save(out)
    return True


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    url, out = sys.argv[1], sys.argv[2]
    if fetch(url, out):
        im = Image.open(out)
        print(f'  {im.width}x{im.height}  {out}')
        return 0
    print(f'  failed: {url}')
    return 1


if __name__ == '__main__':
    sys.exit(main())
