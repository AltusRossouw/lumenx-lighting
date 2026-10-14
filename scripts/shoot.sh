#!/usr/bin/env bash
# Screenshot a page from the local dev server.
#
# Vite's HMR websocket keeps the page from ever going idle, so Chrome's
# --virtual-time-budget waits for a settle that never arrives and hangs forever.
# This starts Chrome, waits for the PNG to appear, then kills it. macOS has no
# `timeout` command, hence the background-and-kill.
#
#   scripts/shoot.sh <url> <out.png> [height] [--wait seconds]
set -uo pipefail

URL="${1:?usage: shoot.sh <url> <out.png> [height]}"
OUT="${2:?usage: shoot.sh <url> <out.png> [height]}"
HEIGHT="${3:-2400}"
WAIT=40
[ "${4:-}" = "--wait" ] && WAIT="${5:-40}"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  echo "  Chrome not found at $CHROME" >&2
  exit 1
fi

PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT
rm -f "$OUT"

"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --user-data-dir="$PROFILE" --window-size=1440,"$HEIGHT" \
  --screenshot="$OUT" "$URL" >/dev/null 2>&1 &
PID=$!

for _ in $(seq 1 "$WAIT"); do
  [ -s "$OUT" ] && sleep 3 && break
  sleep 1
done

kill "$PID" 2>/dev/null
wait "$PID" 2>/dev/null

if [ -s "$OUT" ]; then
  echo "  $(wc -c < "$OUT" | tr -d ' ') bytes  ->  $OUT"
else
  echo "  screenshot failed for $URL" >&2
  exit 1
fi
