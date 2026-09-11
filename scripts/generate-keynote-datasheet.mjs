#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const template = valueFor('--template');
const output = valueFor('--output');
const hero = valueFor('--hero');
const dimension = valueFor('--dimension');
const replacementsPath = valueFor('--replacements');
const requestedKeyOutput = valueFor('--key-output');

if (!template || !output || !replacementsPath) {
  console.error('Usage: node scripts/generate-keynote-datasheet.mjs --template <file.key> --output <file.pdf> --replacements <file.json> [--hero <image>] [--key-output <file.key>]');
  process.exit(2);
}

if (process.platform !== 'darwin') {
  console.error('Keynote datasheets require macOS.');
  process.exit(1);
}

for (const required of [template, replacementsPath]) {
  if (!fs.existsSync(required)) {
    console.error(`File not found: ${required}`);
    process.exit(1);
  }
}

const replacements = JSON.parse(fs.readFileSync(replacementsPath, 'utf8'));
const heroRatio = hero ? imageAspectRatio(hero) : null;
const dimensionRatio = dimension ? imageAspectRatio(dimension) : null;
const keyOutput = requestedKeyOutput || output.replace(/\.pdf$/i, '.key');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenx-keynote-'));
const workingTemplate = path.join(tempDir, path.basename(template));
fs.cpSync(template, workingTemplate, { recursive: true });
const safeAreas = template.includes('6x6 6x12')
  ? { hero: [217, 76], dimension: [182, 130] }
  : { hero: [226, 123], dimension: [182, 130] };
const preparedHero = hero ? padImage(hero, safeAreas.hero, tempDir, 'hero.png') : null;
const preparedDimension = dimension ? padImage(dimension, safeAreas.dimension, tempDir, 'dimension.png') : null;

let result;
try {
  const appleScript = buildAppleScript({ template: workingTemplate, output, keyOutput, hero: preparedHero, dimension: preparedDimension, replacements });
  if (process.env.DEBUG_AS === '1') {
    fs.writeFileSync('/tmp/debug-as.txt', appleScript);
    console.error('wrote /tmp/debug-as.txt');
  }
  result = spawnSync('/usr/bin/osascript', ['-'], {
    input: appleScript,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (result.status !== 0) {
  console.error(result.stderr.trim() || 'Keynote export failed.');
  process.exit(result.status || 1);
}
if (process.env.DEBUG_AS === '1' && result.stdout) {
  console.error('[AS LOG]', result.stdout.trim());
}

if (!fs.existsSync(output)) {
  console.error(`Keynote reported success but no PDF was created: ${output}`);
  process.exit(1);
}
if (!fs.existsSync(keyOutput)) {
  console.error(`Keynote reported success but no .key file was created: ${keyOutput}`);
  process.exit(1);
}

console.log(`Created ${path.resolve(output)}`);
console.log(`Created ${path.resolve(keyOutput)}`);

function buildAppleScript({ template, output, keyOutput, hero, dimension, replacements }) {
  const heroRatio = hero ? imageRatio(hero) : 1;
  const dimensionRatio = dimension ? imageRatio(dimension) : 1;
  const replacementPairs = Object.entries(replacements)
    .filter(([key]) => !key.startsWith('__'))
    .map(([from, to]) => `{${quote(from)}, ${asExpression(to)}}`)
    .join(', ');
  const tableCells = (replacements.__TABLE_CELLS__ || [])
    .map(([row, col, text]) => `{${row}, ${col}, ${quote(text)}}`)
    .join(', ');
  const notes = replacements.__NOTES__ ? asExpression(replacements.__NOTES__) : 'missing value';
  const dimensionFills = (replacements.__DIMENSION_FILLS__ || [])
    .map(([minX, file]) => `{${minX}, ${quote(path.resolve(file))}}`)
    .join(', ');
  const overview = replacements.__OVERVIEW_CONTAINS__
    ? quote(replacements.__OVERVIEW_CONTAINS__)
    : 'missing value';
  const overviewTrigger = quote(replacements.__OVERVIEW_TRIGGER__ || 'Highly Durable LED Street Light');
  const omitCondition = (replacements.__OMIT__ || [])
    .map((label) => `(currentText is ${quote(label)} or currentText is (" " & ${quote(label)}))`)
    .join(' or ') || 'false';
  const omitTextCondition = (replacements.__OMIT__ || [])
    .map((label) => `(itemText is ${quote(label)} or itemText is (" " & ${quote(label)}))`)
    .join(' or ') || 'false';
  const omitStatsCondition = (replacements.__OMIT_STATS__ || [])
    .map((label) => `(currentText is ${quote(label)} or currentText is (" " & ${quote(label)}))`)
    .join(' or ') || 'false';
  const omitStatsTextCondition = (replacements.__OMIT_STATS__ || [])
    .map((label) => `(itemText is ${quote(label)} or itemText is (" " & ${quote(label)}))`)
    .join(' or ') || 'false';
  const rowPairs = Object.entries(replacements.__ROWS__ || {})
    .map(([label, value]) => `{${quote(label)}, ${quote(value)}}`)
    .join(', ');
  const statPairs = Object.entries(replacements.__STATS__ || {})
    .map(([label, value]) => `{${quote(label)}, ${quote(value)}}`)
    .join(', ');
  const heroBlock = hero
    ? `
      repeat with imageRef in images of slideObj
        set candidateImage to contents of imageRef
        try
          set candidatePosition to position of candidateImage
            if (item 2 of candidatePosition > 50) and (item 2 of candidatePosition < 300) then
              set frameWidth to width of candidateImage
              set frameHeight to height of candidateImage
              set frameX to item 1 of candidatePosition
              set frameY to item 2 of candidatePosition
              set file name of candidateImage to (POSIX file ${quote(path.resolve(hero))})
              set fittedWidth to frameWidth
              set fittedHeight to frameWidth / ${heroRatio}
              if fittedHeight > frameHeight then
                set fittedHeight to frameHeight
                set fittedWidth to frameHeight * ${heroRatio}
              end if
              set width of candidateImage to fittedWidth
              set height of candidateImage to fittedHeight
              set position of candidateImage to {frameX + ((frameWidth - fittedWidth) / 2), frameY + ((frameHeight - fittedHeight) / 2)}
            end if
        end try
      end repeat`
    : '';
  const dimensionBlock = dimension
    ? `
      try
        repeat with imageRef in images of slideObj
          set candidateImage to contents of imageRef
          try
            set candidatePosition to position of candidateImage
            if item 2 of candidatePosition > 600 then
              if (width of candidateImage) > (height of candidateImage) then
                set frameWidth to width of candidateImage
                set frameHeight to height of candidateImage
                set frameX to item 1 of candidatePosition
                set frameY to item 2 of candidatePosition
                set file name of candidateImage to (POSIX file ${quote(path.resolve(dimension))})
                set fittedWidth to frameWidth
                set fittedHeight to frameWidth / ${dimensionRatio}
                if fittedHeight > frameHeight then
                  set fittedHeight to frameHeight
                  set fittedWidth to frameHeight * ${dimensionRatio}
                end if
                set width of candidateImage to fittedWidth
                set height of candidateImage to fittedHeight
                set position of candidateImage to {frameX + ((frameWidth - fittedWidth) / 2), frameY + ((frameHeight - fittedHeight) / 2)}
              else
                set opacity of candidateImage to 0
              end if
            end if
          end try
        end repeat
      end try`
    : `
      try
        repeat with imageRef in images of slideObj
          set candidateImage to contents of imageRef
          try
            if (item 2 of (position of candidateImage)) > 600 then set opacity of candidateImage to 0
          end try
        end repeat
      end try`;
  const dimensionRuleBlock = dimension
    ? ''
    : `
      repeat with shapeIndex from (count of shapes of slideObj) to 1 by -1
        set dimensionRule to shape shapeIndex of slideObj
        try
          set rulePosition to position of dimensionRule
          if (item 1 of rulePosition is 30) and (item 2 of rulePosition is 663) then delete dimensionRule
        end try
      end repeat`;

  return `on run
  tell application "Keynote"
    activate
    repeat with docRef in documents
      try
        close (contents of docRef) saving no
      end try
    end repeat
    open (POSIX file ${quote(path.resolve(template))})
    delay 4
    set doc to front document
    set replacements to {${replacementPairs}}
    set rowReplacements to {${rowPairs}}
    set statReplacements to {${statPairs}}
    set tableCells to {${tableCells}}
    set notes to ${notes}
    set dimensionFills to {${dimensionFills}}
    set omittedLeftYs to {}
    set omittedRightYs to {}
    repeat with slideRef in slides of doc
      set slideObj to contents of slideRef
      repeat with itemIndex from (count of text items of slideObj) to 1 by -1
        set itemObj to text item itemIndex of slideObj
        try
          set currentText to object text of itemObj as text
          if ${omitCondition} then
            set omittedPosition to position of itemObj
            if (item 1 of omittedPosition) < 300 then
              set end of omittedLeftYs to item 2 of omittedPosition
            else
              set end of omittedRightYs to item 2 of omittedPosition
            end if
          end if
        end try
      end repeat
      repeat with itemIndex from (count of text items of slideObj) to 1 by -1
        set itemObj to text item itemIndex of slideObj
        try
          set itemPosition to position of itemObj
          set itemText to object text of itemObj as text
          set deletedFlag to false
          if ${omitTextCondition} or ${omitStatsTextCondition} or itemText is "—" or itemText is "-" then
            delete itemObj
            set deletedFlag to true
          end if
          repeat with omittedY in omittedLeftYs
            if not deletedFlag then
              set omitDy to (item 2 of itemPosition) - (contents of omittedY)
              if omitDy < 0 then set omitDy to -omitDy
              if (item 1 of itemPosition) < 300 and omitDy < 3 then
                delete itemObj
                set deletedFlag to true
              end if
            end if
          end repeat
          repeat with omittedY in omittedRightYs
            if not deletedFlag then
              set omitDy to (item 2 of itemPosition) - (contents of omittedY)
              if omitDy < 0 then set omitDy to -omitDy
              if (item 1 of itemPosition) > 300 and omitDy < 3 then
                delete itemObj
                set deletedFlag to true
              end if
            end if
          end repeat
        end try
      end repeat
      repeat with itemRef in text items of slideObj
        set itemObj to contents of itemRef
        set currentText to ""
        try
          set currentText to object text of itemObj as text
        end try
        repeat with rowRef in rowReplacements
          set rowPair to contents of rowRef
          if currentText is item 1 of rowPair then
            set labelPosition to position of itemObj
            repeat with valueIndex from (count of text items of slideObj) to 1 by -1
              set valueItem to text item valueIndex of slideObj
              try
                set valuePosition to position of valueItem
                set rowDy to (item 2 of valuePosition) - (item 2 of labelPosition)
                if rowDy < 0 then set rowDy to -rowDy
                if (item 1 of valuePosition > (item 1 of labelPosition)) and rowDy < 3 then set object text of valueItem to item 2 of rowPair
              end try
            end repeat
          end if
        end repeat
        repeat with statRef in statReplacements
          set statPair to contents of statRef
          if currentText is item 1 of statPair then
            set statPosition to position of itemObj
            repeat with statIndex from (count of text items of slideObj) to 1 by -1
              set statValueItem to text item statIndex of slideObj
              try
                set statValuePosition to position of statValueItem
                set statDx to (item 1 of statValuePosition) - (item 1 of statPosition)
                if statDx < 0 then set statDx to -statDx
                set statDy to (item 2 of statPosition) - (item 2 of statValuePosition)
                if statDx < 35 and statDy > 0 and statDy < 60 then set object text of statValueItem to item 2 of statPair
              end try
            end repeat
          end if
        end repeat
        if ${overview} is not missing value and currentText contains ${overviewTrigger} then
          set object text of itemObj to ${overview}
          set currentText to ""
        end if
        repeat with pairRef in replacements
          set pair to contents of pairRef
          if currentText is item 1 of pair or currentText is (" " & item 1 of pair) then
            set object text of itemObj to item 2 of pair
            set currentText to item 2 of pair
          end if
        end repeat
      end repeat
      repeat with itemIndex from (count of text items of slideObj) to 1 by -1
        set itemObj to text item itemIndex of slideObj
        try
          if (object text of itemObj as text) is "—" or (object text of itemObj as text) is "-" then delete itemObj
        end try
      end repeat
      if (count of tableCells) > 0 then
        try
          repeat with cellRef in tableCells
            set cellPair to contents of cellRef
            set value of (cell (item 2 of cellPair) of row (item 1 of cellPair) of table 1 of slideObj) to item 3 of cellPair
          end repeat
        end try
      end if
      if notes is not missing value then
        tell slideObj
          set noteItem to make new text item with properties {object text: notes, position: {312, 768}, width: 285, height: 44}
        end tell
        tell object text of noteItem
          set size to 5
          set its font to "Helvetica"
          set its color to {30326, 30583, 30840}
        end tell
      end if${dimension ? '' : `
      repeat with itemIndex from (count of text items of slideObj) to 1 by -1
        set itemObj to text item itemIndex of slideObj
        try
          if (object text of itemObj as text) is "DIMENSION DRAWING" then delete itemObj
        end try
      end repeat`}${dimensionBlock}${dimensionRuleBlock}${heroBlock}
      if (count of dimensionFills) > 0 then
        repeat with imageRef in images of slideObj
          set candidateImage to contents of imageRef
          try
            set candidatePosition to position of candidateImage
            if (item 2 of candidatePosition) > 600 then
              repeat with fillRef in dimensionFills
                set fillPair to contents of fillRef
                if (item 1 of candidatePosition) >= (item 1 of fillPair) then
                  set file name of candidateImage to (POSIX file (item 2 of fillPair))
                  set opacity of candidateImage to 100
                end if
              end repeat
            end if
          end try
        end repeat
      end if
    end repeat
    save doc in (POSIX file ${quote(path.resolve(keyOutput))})
    export doc to (POSIX file ${quote(path.resolve(output))}) as PDF
    close doc saving no
    return "clean"
  end tell
end run
`;
}

function imageRatio(filePath) {
  const output = spawnSync('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath], {
    encoding: 'utf8',
  }).stdout;
  const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`Could not read image dimensions: ${filePath}`);
  return width / height;
}

function padImage(filePath, [width, height], tempDir, outputName) {
  const outputPath = path.join(tempDir, outputName);
  const result = spawnSync('/usr/bin/sips', [
    '--padToHeightWidth', String(height), String(width),
    '--padColor', 'FFFFFF', filePath, '--out', outputPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(`Could not fit image into safe area: ${filePath}`);
  }
  return outputPath;
}

function quote(value) {
  return JSON.stringify(String(value))
    .replace(/\\u2028/g, '\\u2028')
    .replace(/\\u2029/g, '\\u2029');
}
// Quote a value for AppleScript; values containing newlines become a string
// concatenation using (character id 10) so Keynote gets real line breaks.
function asExpression(value) {
  const parts = String(value).split('\n');
  if (parts.length === 1) return quote(value);
  return '(' + parts.map((part) => quote(part)).join(' & (character id 10) & ') + ')';
}
function imageAspectRatio(imagePath) {
  const result = spawnSync('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', imagePath], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Could not read image dimensions: ${imagePath}`);
  const width = Number(result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`Invalid image dimensions: ${imagePath}`);
  return width / height;
}