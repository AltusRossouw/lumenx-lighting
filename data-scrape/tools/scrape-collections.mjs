// Scrape specs for Pioled collection products by fetching each member product
// page and aggregating its colon-dump specs into range-level values.
//
// Output: data-scrape/collection-specs.json  ({ "<entry>": [ {label, value} ] })
// Then the catalogue generator merges these in.
import fs from 'fs';
import path from 'path';
import { getHtml } from './lib/net.mjs';
import { extractFromHtml, normalizeHost } from './lib/extract.mjs';

const OUT_ROOT = path.join(path.dirname(process.cwd()), 'products');
const OUT_JSON = path.join(path.dirname(process.cwd()), 'collection-specs.json');

// Parse a colon-delimited 'Label: value' dump (Pioled og:description style)
// into [{label, value}], tolerating merged labels like "Lumen Output: 2 500lm PF: 0.9".
function parseSpecDump(text) {
  const s = (text || '').replace(/\s+/g, ' ').trim();
  if (!s || !s.includes(':')) return [];
  // Known label stems (ordered, longest first) to split on reliably.
  const LABELS = [
    'Colour Temperature', 'Lumen Output', 'Input Voltage', 'Operating temp',
    'LED Chips', 'Surge Protection', 'Beam', 'Housing', 'Wattage', 'Colour',
    'Flicker Free CRI', 'PF', 'Dimmable', 'Certifications', 'IK Rating',
    'IP Rating', 'CRI', 'CCT', 'UGR', 'Dimming', 'Lifetime', 'Lumen',
  ];
  const labelRe = new RegExp('\\b(' + LABELS.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\s*:', 'gi');
  const out = [];
  let lastIdx = 0;
  const matches = [...s.matchAll(labelRe)];
  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1];
    const valueStart = matches[i].index + matches[i][0].length;
    const valueEnd = i + 1 < matches.length ? matches[i + 1].index : s.length;
    const value = s.slice(valueStart, valueEnd).trim().replace(/[,\s]+$/, '');
    if (label && value) out.push({ label, value });
  }
  return out;
}

function aggNumber(value) {
  // extract leading number(s); handles "2 500lm", "35W", "1 500lm"
  const m = String(value).replace(/\s/g, '').match(/^([\d,.]+)/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

// Junk markers found in collection-page member descriptions (unrelated
// "recommended" products: drivers, floods, downlights, glass tubes).
const JUNK_RE = /(driver|dim|12v|24v|96w|192w|nano|flood|coastal|modular|960w|300w|glass tube|downlight|luigi|sylo|wireless)/i;

function cleanValue(v) {
  let s = String(v || '').trim();
  if (JUNK_RE.test(s)) return '';
  // strip trailing junk like "PF: 0.9", "DOWNLOAD SPEC SHEET", "*2 YEAR WARRANTY"
  s = s.replace(/\s*PF:\s*[^/|]+$/i, '');
  s = s.replace(/DOWNLOAD SPEC SHEET/i, '');
  s = s.replace(/\*?\d+\s*YEAR WARRANTY/i, '');
  s = s.replace(/[,\s]+$/, '');
  return s.trim();
}

function aggLabel(map) {
  // map label -> [values], cleaned + deduped, joined with ' / '
  const out = [];
  for (const [label, vals] of map) {
    const cleaned = [...new Set(vals.map(cleanValue).filter(Boolean))];
    if (!cleaned.length) continue;
    out.push({ label, value: cleaned.join(' / ') });
  }
  return out;
}

// Merge spec rows with same canonical label, aggregating values.
function canonicalLabel(l) {
  const s = l.toLowerCase().replace(/\s+/g, ' ').trim();
  if (s.includes('wattage') || s === 'power') return 'Wattage';
  if (s.includes('lumen')) return 'Lumen Output';
  if (s.includes('colour temperature') || s === 'cct') return 'Colour Temperature';
  if (s.includes('cri')) return 'CRI';
  if (s.includes('input voltage') || s === 'voltage') return 'Input Voltage';
  if (s.includes('beam')) return 'Beam Angle';
  if (s.includes('ip rating') || s === 'ip') return 'IP Rating';
  if (s.includes('ik rating')) return 'IK Rating';
  if (s.includes('housing')) return 'Housing';
  if (s.includes('led chips')) return 'LED Chips';
  if (s.includes('surge')) return 'Surge Protection';
  if (s.includes('dimm')) return 'Dimmable';
  if (s.includes('operating temp')) return 'Operating Temp';
  if (s.includes('pf') || s.includes('power factor')) return 'Power Factor';
  if (s.includes('colour') || s.includes('color')) return 'Colour';
  if (s.includes('certif')) return 'Certifications';
  if (s.includes('lifetime') || s.includes('life span')) return 'Lifetime';
  if (s.includes('ugr')) return 'UGR';
  return s;
}

async function scrapeMember(url) {
  const r = await getHtml(url);
  const host = normalizeHost(url);
  const scrape = await extractFromHtml({ html: r.html, finalUrl: r.finalUrl, host });
  // Prefer scrape.specs; if empty, parse og:description dump from the raw html
  let specs = scrape.specs || [];
  if (!specs.length) {
    const ogDesc = (r.html.match(/property="og:description"\s+content="([^"]+)"/i) || [])[1];
    specs = parseSpecDump(ogDesc || '');
  }
  return { name: scrape.name || '', specs };
}

function aggregate(memberSpecs) {
  const map = new Map();
  for (const ms of memberSpecs) {
    for (const s of ms.specs) {
      const key = canonicalLabel(s.label);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s.value);
    }
  }
  return aggLabel(map);
}

async function main() {
  const cats = fs.readdirSync(OUT_ROOT).filter(d => !d.startsWith('.') && !d.includes('00-'));
  const result = {};
  let totalMembers = 0;
  for (const cat of cats) {
    for (const entry of fs.readdirSync(path.join(OUT_ROOT, cat))) {
      const pj = path.join(OUT_ROOT, cat, entry, 'product.json');
      if (!fs.existsSync(pj)) continue;
      const d = JSON.parse(fs.readFileSync(pj, 'utf8'));
      const members = (d.scrape?.members || []).filter(m => m.url && m.url.includes('/product/'));
      if (!members.length) continue;
      const memberSpecs = [];
      for (const m of members) {
        try {
          const ms = await scrapeMember(m.url);
          if (ms.specs.length) memberSpecs.push(ms);
          totalMembers++;
        } catch (e) {
          console.error('  ! failed', m.url, e.message);
        }
      }
      result[entry] = aggregate(memberSpecs);
      console.log(`${entry}: ${memberSpecs.length}/${members.length} members scraped -> ${result[entry].length} specs`);
      await new Promise(r => setTimeout(r, 400));
    }
  }
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
  console.log('WROTE', OUT_JSON, 'total members scraped:', totalMembers);
}

main().catch(e => { console.error(e); process.exit(1); });
