#!/usr/bin/env bash
# Fetch an image through headless Chrome.
#
# Steinel's CDN answers curl with a 403 (bot protection) but serves the browser
# normally, so the image is loaded into a local page and captured from the
# render. The page reports the image's natural size in its title, which gives the
# window size to screenshot and therefore the crop.
#
#   fetch-image-via-chrome.sh <image-url> <output.png>
set -euo pipefail

URL="$1"
OUT="$2"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cat > "$WORK/page.html" <<HTML
<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#fff}img{display:block}</style></head>
<body><img id="i" src="$URL">
<script>
  var im = document.getElementById('i');
  function report(){ document.title = im.naturalWidth + 'x' + im.naturalHeight; }
  if (im.complete) report(); else im.onload = report;
</script></body></html>
HTML

DOM="$("$CHROME" --headless --disable-gpu --no-sandbox \
  --user-agent="$UA" --virtual-time-budget=20000 \
  --dump-dom "file://$WORK/page.html" 2>/dev/null || true)"

SIZE="$(printf '%s' "$DOM" | sed -n 's:.*<title>\([0-9]*x[0-9]*\)</title>.*:\1:p' | head -1)"
if [ -z "$SIZE" ]; then
  echo "  could not read the image size for $URL" >&2
  exit 1
fi
W="${SIZE%x*}"
H="${SIZE#*x}"

"$CHROME" --headless --disable-gpu --no-sandbox \
  --user-agent="$UA" --virtual-time-budget=20000 \
  --hide-scrollbars --window-size="$W,$H" \
  --screenshot="$OUT" "file://$WORK/page.html" >/dev/null 2>&1

echo "  $W x $H  ->  $OUT"
