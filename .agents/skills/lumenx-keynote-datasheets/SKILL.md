---
name: lumenx-keynote-datasheets
description: "Generate LumenX product datasheet PDFs from Apple Keynote templates. Use when creating or updating official product spec sheets from a .key file, replacing product copy/images, or exporting a repeatable Keynote datasheet without modifying the source template. Requires macOS and Keynote."
---

# LumenX Keynote Datasheets

Use the repository CLI to generate an official-looking PDF from a Keynote template:

```sh
node scripts/generate-keynote-datasheet.mjs \
  --template public/catalogues/lumenx/lumenx-datasheet-35w-track-spot.key \
  --output /tmp/LumenX_35W_Track_Spot.pdf \
  --hero public/product-images/35W_Track_Spot/img-001.png \
  --replacements /tmp/35w-track-spot-replacements.json
```

The CLI opens the source `.key`, changes the document only in memory, exports a
PDF, saves the edited `.key` beside the PDF, and closes. The original Keynote
template is not modified. By default, `Product.pdf` produces `Product.key`; use
`--key-output` to choose a different `.key` path.

## Requirements

- macOS
- Keynote installed and launchable
- `/usr/bin/osascript`
- A one-slide Keynote template with editable text items

This workflow is for authoring/export on a Mac. It is not suitable for the
Docker production server; use the HTML/Chromium datasheet generator there.

## Replacement map

`--replacements` accepts a JSON object mapping exact existing text to replacement
text.

Special keys:

- `__OVERVIEW_CONTAINS__` — replacement for the overview paragraph. The trigger
  defaults to the Street Light sentence; set `__OVERVIEW_TRIGGER__` to the unique
  substring of the template's own overview (e.g. `"back-lit panel"`).
- `__OMIT__` — list of table row labels to delete. Matches the label text exactly
  and also deletes the value on the same line, without touching the overview.
- `__OMIT_STATS__` — list of stat chips to delete outright (value and label),
  e.g. `["3900-6500", "LUMENS"]`.
- `__ROWS__` — label → value map for table rows. Works for both the left
  (PHYSICAL) and right (PRODUCT INFORMATION) columns.

Example (thorough 6x6 6x12 Recessed Panel template):

```json
{
  "PANEL LIGHTING": "TRACK SPOTS AND TRACKS",
  "RECESSED PANEL": "35W TRACK SPOT",
  "30-50W": "35W",
  "3900-6500": "3500",
  "IP20": "IP20",
  "__OVERVIEW_TRIGGER__": "back-lit panel",
  "__OVERVIEW_CONTAINS__": "Dynamic dual heat sink track spot with a deep 36° reflector, 3kV surge protection and a 3-wire track mounting system.",
  "__OMIT__": ["Lumen Output", "Frequency"],
  "__OMIT_STATS__": ["3900-6500", "LUMENS"],
  "__ROWS__": {
    "Wattage": "35W",
    "Warranty": "5 Years"
  }
}
```

Keep replacements specific. Broad values such as `-` can unintentionally
replace several fields in a Keynote document.
Use `--dimension <image>` when the product has a real dimension drawing. If it
is omitted, the template's shared drawing, underline and `DIMENSION DRAWING`
heading are hidden rather than reused incorrectly.
