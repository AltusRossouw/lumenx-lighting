#!/usr/bin/env python3
"""Shared artwork for LumenX card and product-tile images.

Both the category cards and the product tiles put a product shot on the same
teal radial gradient. This module holds that treatment so the two stay
identical.

The knockout rule matters more than it looks. Most supplier shots are white or
light-grey products on a white background, so a naive "remove near-white" pass
eats the product and leaves ragged halos around it. Only white *connected to the
image border* is removed, which preserves the product's own white body. When a
product is white anyway and touches the edge, no knockout can save it — choose a
different source image.
"""
import numpy as np
from PIL import Image, ImageDraw

# canvas
W, H = 1600, 900

# teal radial glow on dark navy, sampled from the original category cards
EDGE_TOP = (10, 24, 35)
EDGE_BOTTOM = (6, 17, 23)
CORE_TOP = (6, 71, 89)
CORE_BOTTOM = (4, 65, 83)

KEY = (255, 0, 255)


def gradient(width=W, height=H):
    """The shared background: a soft teal glow, slightly above centre."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    cx, cy = width * 0.5, height * 0.42
    d = np.clip(np.sqrt(((xx - cx) / (width * 0.62)) ** 2 + ((yy - cy) / (height * 0.62)) ** 2), 0, 1)
    t = (yy / height)[..., None]
    edge = np.array(EDGE_TOP) * (1 - t) + np.array(EDGE_BOTTOM) * t
    core = np.array(CORE_TOP) * (1 - t) + np.array(CORE_BOTTOM) * t
    k = (1 - d)[..., None] ** 1.6
    return Image.fromarray(np.clip(edge * (1 - k) + core * k, 0, 255).astype(np.uint8), 'RGB')


def _border_pixels(im, band=4):
    """Every pixel in a thin band around the edge of the image."""
    a = np.array(im.convert('RGB'))
    h, w, _ = a.shape
    return np.concatenate([
        a[:band].reshape(-1, 3), a[-band:].reshape(-1, 3),
        a[:, :band].reshape(-1, 3), a[:, -band:].reshape(-1, 3),
    ])


def _dominant_border_colour(im, band=4):
    """The most common edge colour, quantised — the presumed backdrop."""
    px = _border_pixels(im, band) // 8 * 8
    colours, counts = np.unique(px, axis=0, return_counts=True)
    return colours[counts.argmax()], counts.max() / len(px)


def strip_border_background(im, tol=38):
    """Remove the backdrop, whatever colour it is.

    Supplier shots come on white, light grey and black. Matching only near-white
    left the grey ones as visible boxes and the black ones as dark slabs, so the
    backdrop colour is sampled from the border instead and only pixels connected
    to the border are removed — which is what keeps a white product's own body
    intact.
    """
    im = im.convert('RGB')
    w, h = im.size
    bg, share = _dominant_border_colour(im)
    if share < 0.18:
        # the edge is not a uniform backdrop (a lifestyle shot, or a composite) —
        # nothing safe to remove
        return im.convert('RGBA')

    bg_img = Image.new('RGB', (w, h), tuple(int(c) for c in bg))
    diff = np.abs(np.array(im, dtype=np.int16) - np.array(bg_img, dtype=np.int16)).sum(axis=2)
    # .copy() matters: Image.fromarray returns a READ-ONLY image and
    # ImageDraw.floodfill silently does nothing on one, so the backdrop would
    # never be removed and every grey/black background would stay a visible box.
    near = Image.fromarray(np.where(diff <= tol, 255, 0).astype(np.uint8), 'L').copy()

    for x in range(w):
        for y in (0, h - 1):
            if near.getpixel((x, y)) == 255:
                ImageDraw.floodfill(near, (x, y), 128, thresh=0)
    for y in range(h):
        for x in (0, w - 1):
            if near.getpixel((x, y)) == 255:
                ImageDraw.floodfill(near, (x, y), 128, thresh=0)

    transparent = np.array(near) == 128
    return Image.fromarray(
        np.dstack([np.array(im), np.where(transparent, 0, 255).astype(np.uint8)]).astype(np.uint8),
        'RGBA')


def strip_border_white(im):
    """Backwards-compatible alias — see strip_border_background."""
    return strip_border_background(im)


def prepare(src):
    """Load a product shot and return it trimmed, on transparency."""
    im = Image.open(src)
    if np.array(im.convert('RGBA'))[:, :, 3].min() > 10:      # no real alpha channel
        im = strip_border_white(im)
    im = im.convert('RGBA')
    al = np.array(im)[:, :, 3]
    ys, xs = np.where(al > 10)
    if len(xs):
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    return im


def compose(src, dest, height_frac=0.62, y_shift=-0.02, width_frac=0.82, quality=92):
    """Render one product shot onto the shared gradient at 16:9."""
    im = prepare(src)
    target = int(H * height_frac)
    r = target / im.height
    if im.width * r > W * width_frac:
        r = (W * width_frac) / im.width
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    base = gradient()
    base.paste(im, ((W - im.width) // 2, int((H - im.height) // 2 + H * y_shift)), im)
    base.save(dest, quality=quality, optimize=True)
    return im.size
