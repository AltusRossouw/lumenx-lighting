# IES Walled Garden

This directory holds the raw photometric (`.ies`) files. It sits **outside** the
public web root (`public/`) and is **never** served as a static asset.

- Files are only streamed through `GET /api/ies/:filename`, which requires a
  signed-in account (sign-up is self-serve, no admin approval).
- Only files matching `LumenX*` (case-insensitive) and whose `[MANUFAC]` keyword
  is `LumenX` are recognised. This is the allowlist that keeps third-party IES
  files out of the design tool.

To populate with real measurement files, drop them here with the `LumenX_`
prefix and a `[MANUFAC] LumenX` line. Run `npm run ies:seed` to (re)generate the
sample placeholder set.
