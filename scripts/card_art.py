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
from PIL import Image, ImageDraw, ImageFilter

# canvas
W, H = 1600, 900

# teal radial glow on dark navy, sampled from the original category cards
EDGE_TOP = (10, 24, 35)
EDGE_BOTTOM = (6, 17, 23)
CORE_TOP = (6, 71, 89)
CORE_BOTTOM = (4, 65, 83)

KEY = (255, 0, 255)

# Where the white-on-white highlight shoulder begins — see shade_product. 200 is
# below every white body's own shading but above the greys of a dark fitting that
# happens to be allow-listed, so a product's contrast survives the correction.
HIGHLIGHT_KNEE = 200


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


def strip_border_background(im, tol=38, edge_guard=0):
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

    # Edge guard. On a white product against a white background, colour alone
    # cannot separate them at any tolerance: too loose and the fill creeps
    # through the product and shreds it, too tight and nothing is removed at all.
    # Requiring a pixel to sit in a FLAT region as well as match the backdrop
    # stops the fill at the product's outline, because that is where the
    # gradient is.
    grey = np.array(im.convert('L'), dtype=np.int16)
    gy, gx = np.gradient(grey)
    grad = np.hypot(gx, gy)
    removable = (diff <= tol) & (grad <= edge_guard)

    # .copy() matters: Image.fromarray returns a READ-ONLY image and
    # ImageDraw.floodfill silently does nothing on one, so the backdrop would
    # never be removed and every grey/black background would stay a visible box.
    near = Image.fromarray(np.where(removable, 255, 0).astype(np.uint8), 'L').copy()

    for x in range(w):
        for y in (0, h - 1):
            if near.getpixel((x, y)) == 255:
                ImageDraw.floodfill(near, (x, y), 128, thresh=0)
    for y in range(h):
        for x in (0, w - 1):
            if near.getpixel((x, y)) == 255:
                ImageDraw.floodfill(near, (x, y), 128, thresh=0)

    transparent = np.array(near) == 128
    alpha = Image.fromarray(np.where(transparent, 0, 255).astype(np.uint8), 'L')

    # Erode, then feather. A binary mask leaves every anti-aliased pixel along
    # the product's outline behind, which reads as a jagged white fringe around
    # the whole fitting and scattered speckles in the corners. Shrinking the mask
    # by a pixel cuts that fringe away; the feather stops the new edge looking
    # like it was cut with scissors.
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.5))

    return Image.fromarray(
        np.dstack([np.array(im), np.array(alpha)]).astype(np.uint8),
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


def resize_rgba(im, size):
    """Resize RGBA without dragging the transparent pixels' colour into the edge.

    A cut-out keeps whatever colour its transparent pixels had — white, for a
    photo shot on white. Resampling the channels directly averages that white
    into every boundary pixel, which is what put a ragged white fringe around
    each fitting. Premultiplying by alpha first, then dividing it back out, is
    the fix.
    """
    a = np.array(im).astype(np.float32)
    alpha = a[:, :, 3:4] / 255.0
    pre = np.dstack([a[:, :, :3] * alpha, a[:, :, 3]])
    out = np.array(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS))
    oa = out[:, :, 3:4] / 255.0
    rgb = np.divide(out[:, :, :3], oa, out=np.zeros_like(out[:, :, :3], dtype=np.float32), where=oa > 0)
    return Image.fromarray(
        np.dstack([np.clip(rgb, 0, 255), out[:, :, 3]]).astype(np.uint8), 'RGBA')


def is_light_on_light(src):
    """Is this a pale product photographed on a pale backdrop?

    Those cannot be cut out cleanly at any tolerance, because the pixel where
    the product ends and the backdrop begins is the same colour on both sides —
    the mask boundary lands wherever JPEG noise happens to stop the fill, which
    shows up as a torn white fringe around the fitting.
    """
    try:
        im = Image.open(src).convert('RGB')
    except Exception:                                     # noqa: BLE001
        return False
    bg, share = _dominant_border_colour(im)
    if share < 0.50 or int(bg.mean()) < 200:
        return False                                      # dark backdrop: cut-out is fine
    stripped = strip_border_background(im)
    a = np.array(stripped)
    kept = a[:, :, 3] > 128
    if kept.sum() < 50:
        return False
    return float(np.array(im.convert('L'))[kept].mean()) > 185


def compose_glow(src, dest, height_frac=0.58, quality=92):
    """Place the whole photo on a soft elliptical glow that fades into the gradient.

    Used for pale-on-pale shots. Rather than pretending to cut the product out,
    it reads as light spilling from the fitting, which suits the brand.
    """
    im = Image.open(src).convert('RGB')
    target = int(H * height_frac)
    r = target / im.height
    if im.width * r > W * 0.86:
        r = (W * 0.86) / im.width
    w, h = max(1, int(im.width * r)), max(1, int(im.height * r))
    im = im.resize((w, h), Image.LANCZOS)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    a = np.clip((1.05 - d) / (1.05 - 0.55), 0, 1)
    base = gradient()
    base.paste(im, ((W - w) // 2, (H - h) // 2), Image.fromarray((a * 255).astype(np.uint8), 'L'))
    base.save(dest, quality=quality, optimize=True)
    return (w, h)


def compose_cutout(cut_path, dest, height_frac=0.62, y_shift=-0.02, width_frac=0.82, quality=92):
    """Place an already-segmented cut-out (see scripts/make-cutouts.py) on the gradient.

    This is the path everything takes now. The cut-out comes from rembg, so there
    is no backdrop left to reason about — only scaling and compositing.
    """
    im = Image.open(cut_path).convert('RGBA')
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 10)
    if len(xs):
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    target = int(H * height_frac)
    r = target / im.height
    if im.width * r > W * width_frac:
        r = (W * width_frac) / im.width
    im = resize_rgba(im, (max(1, int(im.width * r)), max(1, int(im.height * r))))
    base = gradient()
    base.paste(im, ((W - im.width) // 2, int((H - im.height) // 2 + H * y_shift)), im)
    base.save(dest, quality=quality, optimize=True)
    return im.size


def tile_background(im):
    """The colour a product's own backdrop should become on the tile.

    This is the whole point of the flat treatment. Cutting a product out is where
    the halos, the notches and the flat-clipped domes came from, and on a pale
    product against a pale sweep no mask is reliable. So the product is not cut
    out at all: the tile is painted the colour it was photographed on, and it
    blends with nothing to get wrong at the edge.

    A source with real alpha has no backdrop to match, so it goes on white --
    which is what the printed catalogue does too.
    """
    alpha = np.array(im.convert('RGBA'))[:, :, 3]
    if (alpha < 10).mean() > 0.05:
        return (255, 255, 255)
    bg, _share = _dominant_border_colour(im)
    bg = tuple(int(c) for c in bg)
    # Everything ends up on white. A sweep that is already white needs nothing;
    # a grey one is lifted instead of matched, because matching leaves a seam --
    # the dominant border colour is quantised and a JPEG sweep is never perfectly
    # flat, so the tile and the image disagree by a few levels and the eye reads
    # it as a rectangle. A white-point lift removes the disagreement entirely and
    # gives the grid the single white frame the catalogue contract asks for.
    return (255, 255, 255)


def whiten(im, bg):
    """Scale the image so its own backdrop reaches pure white.

    Only the six grey-sweep sources take this path. It is a per-channel gain, so
    it lifts the whole frame slightly; on those products (dark wall lights, a
    white batten, post tops) that is invisible, and it is what lets them sit on
    the same white tile as the other 101.
    """
    if min(bg) >= 244:
        return im
    a = np.array(im.convert('RGB')).astype(np.float32)
    gain = np.array([255.0 / max(1, c) for c in bg], dtype=np.float32)
    return Image.fromarray(np.clip(a * gain, 0, 255).astype(np.uint8), 'RGB')


def shade_product(im, shade, bg):
    """Pull the PRODUCT's own highlights down on a flat tile.

    This exists for one client note: *"the gray background… could we not adjust
    the contrast on the product itself so it's not so white? It's just blending
    in there."* A white fitting on a white tile has nowhere to sit: everything
    ends up on white, because a product shot's own sweep is lifted to white so
    the grid reads as one frame (see tile_background and whiten), and a product
    that is genuinely white then has no edge at all.

    The point of doing it here rather than in the tile script is the mask. The
    adjustment is applied to the subject pixels ONLY, so the white frame stays
    pure white and only the body moves — which is what separates the product from
    the tile instead of greying the whole card. `bg` is the colour the tile will
    be painted, so the same mask works whether the source is a transparent
    cut-out (mask on alpha) or an opaque shot (mask on distance from its sweep).

    `shade` is a highlight-rolloff strength in (0, 1). It compresses the top of
    the range with a shoulder that starts at KNEE and lands 255 on
    KNEE + (255 - KNEE) * shade, leaving everything at or below the knee exactly
    as it was. So 0.55 takes a clipped 255 down to about 225 while the product's
    own shading, its shadows and its mid-greys are untouched, and nothing is
    crushed.

    A plain gain was tried first and is wrong here. Multiplying a *clipped* 255
    by 0.86 and multiplying the 244 next to it by 0.86 moves the two apart by
    1.7 levels, so the ragged edge of every blown highlight on the product turns
    into a visible hard-edged patch — on the 600x1200 panel it put a mottled
    white blob across the diffuser that the unadjusted tile did not show at all.
    Compressing the top instead keeps neighbours together: those same two pixels
    move 30 and 3.6 levels, but towards each other rather than apart. The white
    point still lands where the brief wants it; the texture inside it survives.
    """
    if not shade or shade >= 1.0:
        return im
    rgba = np.array(im.convert('RGBA')).astype(np.float32)
    rgb, alpha = rgba[:, :, :3], rgba[:, :, 3]
    if (alpha < 250).mean() > 0.05:
        subject = alpha > 10                       # a real cut-out: alpha is the mask
    else:
        subject = np.abs(rgb - np.array(bg, dtype=np.float32)).sum(axis=2) > 12
    if not subject.any():
        return im
    target = HIGHLIGHT_KNEE + (255.0 - HIGHLIGHT_KNEE) * shade
    body = rgb[subject]
    hi = body > HIGHLIGHT_KNEE
    body[hi] = HIGHLIGHT_KNEE + (body[hi] - HIGHLIGHT_KNEE) * (
        (target - HIGHLIGHT_KNEE) / (255.0 - HIGHLIGHT_KNEE))
    rgb[subject] = np.clip(body, 0, 255)
    return Image.fromarray(
        np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')


def compose_photo(src, dest, focus=0.42, quality=92):
    """Fill the tile with an application/installation photograph.

    Used for the decorative range, where the client asked for the *installation*
    picture rather than a product render. `compose_flat` cannot take these: it
    whitens an opaque source against its dominant border colour, which is right
    for a product on a white sweep and ruinous for a photograph of a room — the
    border colour is the room, so the whitening eats the walls and the ceiling
    and leaves the frame blown out.

    There is no product to isolate here either, so the photograph is scaled to
    *cover* the 16:9 tile and cropped, rather than fitted inside it. Fitting a
    3:4 portrait would leave a 460px empty margin either side; covering keeps the
    tile full-bleed like every other card in the grid.

    `focus` is where the crop window sits vertically, as a fraction of the
    overflow. These shots frame the fitting high in the room, so the default
    biases the crop upwards rather than taking the dead centre.
    """
    im = Image.open(src).convert('RGB')
    scale = max(W / im.width, H / im.height)
    resized = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    left = (resized.width - W) // 2
    top = round((resized.height - H) * focus)
    resized.crop((left, top, left + W, top + H)).save(dest, quality=quality, optimize=True)
    return (W, H)


def compose_flat(src, dest, height_frac=0.88, width_frac=0.90, quality=92, shade=None):
    """Place a product shot, whole, on a flat tile of its own backdrop colour.

    No segmentation, no mask, nothing to go wrong at the edges, and the product
    is never cropped. Compare compose_cutout, which needs a mask and shows every
    flaw in it.

    `shade` is the per-product white-on-white correction — see shade_product. It
    is None for every product except the allow-listed ones in
    make-product-tiles.py, so nothing else shifts. It is applied AFTER the
    resize: resampling a corrected image pulls the corrected body back toward the
    white frame at every edge pixel, and the seam that leaves is the exact halo
    the flat treatment exists to avoid.
    """
    im = Image.open(src)
    rgba = im.convert('RGBA')
    bg = tile_background(im)
    if (np.array(rgba)[:, :, 3] < 10).mean() <= 0.05:
        rgba = whiten(rgba, tuple(int(c) for c in _dominant_border_colour(im)[0])).convert('RGBA')
    # Trim to the subject only when there is real alpha. On an opaque source the
    # sweep IS the frame: trimming it would put a hard edge back.
    a = np.array(rgba)[:, :, 3]
    if (a < 10).mean() > 0.05:
        ys, xs = np.where(a > 10)
        if len(xs):
            rgba = rgba.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    target = int(H * height_frac)
    r = target / rgba.height
    if rgba.width * r > W * width_frac:
        r = (W * width_frac) / rgba.width
    placed = resize_rgba(rgba, (max(1, int(rgba.width * r)), max(1, int(rgba.height * r))))
    placed = shade_product(placed, shade, bg)
    base = Image.new('RGB', (W, H), bg)
    base.paste(placed, ((W - placed.width) // 2, (H - placed.height) // 2), placed)
    base.save(dest, quality=quality, optimize=True)
    return placed.size


def compose(src, dest, height_frac=0.62, y_shift=-0.02, width_frac=0.82, quality=92):
    """Render one product shot onto the shared gradient at 16:9.

    Kept for sources with no cached cut-out; the segmentation path above is the
    one that produces good results, and `scripts/make-cutouts.py` covers every
    product.
    """
    if is_light_on_light(src):
        return compose_glow(src, dest, quality=quality)
    im = prepare(src)
    target = int(H * height_frac)
    r = target / im.height
    if im.width * r > W * width_frac:
        r = (W * width_frac) / im.width
    im = resize_rgba(im, (max(1, int(im.width * r)), max(1, int(im.height * r))))
    base = gradient()
    base.paste(im, ((W - im.width) // 2, int((H - im.height) // 2 + H * y_shift)), im)
    base.save(dest, quality=quality, optimize=True)
    return im.size
