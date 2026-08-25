// Generate SAMPLE Luminex IES (LM-63) files into the protected IES directory.
// These are placeholder photometric files so the walled garden and design tool
// are demonstrable end-to-end. Replace them with the manufacturer's real
// measurement files in production.
//
// Usage: npm run ies:seed

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const VERTICAL_ANGLES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
const HORIZONTAL_ANGLES = [0, 45, 90, 135, 180];

// Gaussian beam shape: peak candela at nadir (0°) decaying with angle.
const candelaAt = (peak, sigma, angleDeg) => {
  const radians = (angleDeg * Math.PI) / 180;
  return Math.round(peak * Math.exp(-(radians * radians) / (2 * sigma * sigma)));
};

const buildIes = ({ name, luminaire, lumens, watts, peakCandela, beamSigma }) => {
  const lines = [];
  lines.push('IESNA:LM-63-2002');
  lines.push(`[TEST] LUM-${name.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase()}`);
  lines.push('[MANUFAC] LumenX');
  lines.push(`[LUMCAT] ${luminaire}`);
  lines.push(`[LUMINAIRE] ${luminaire} — sample photometric data`);
  lines.push('[LAMP] LED');
  lines.push(`[INPUTWATTS] ${watts}`);
  lines.push('TILT=NONE');

  const numLamps = 1;
  const candelaMultiplier = 1;
  const numVert = VERTICAL_ANGLES.length;
  const numHoriz = HORIZONTAL_ANGLES.length;
  const photometricType = 1; // Type C
  const unitsType = 2; // metres
  const width = 0.6;
  const length = 0.6;
  const height = 0.1;

  lines.push(`${numLamps} ${lumens} ${candelaMultiplier} ${numVert} ${numHoriz} ${photometricType} ${unitsType} ${width} ${length} ${height}`);
  lines.push(`1.0 1.0 ${watts}`); // ballast factor, future use, input watts

  lines.push(VERTICAL_ANGLES.join(' '));
  lines.push(HORIZONTAL_ANGLES.join(' '));

  const candela = HORIZONTAL_ANGLES.map(() => VERTICAL_ANGLES.map((a) => candelaAt(peakCandela, beamSigma, a)));
  // IES expects values grouped by horizontal angle (each row = one horizontal angle).
  candela.forEach((row) => lines.push(row.join(' ')));

  return lines.join('\n') + '\n';
};

const SAMPLES = [
  { name: 'V200_Highbay_160W', luminaire: 'V200 UFO Highbay 160W', lumens: 32000, watts: 160, peakCandela: 28000, beamSigma: 0.62 },
  { name: 'Saxa_Triproof_54W', luminaire: 'Saxa Triproof 54W', lumens: 6480, watts: 54, peakCandela: 5500, beamSigma: 0.75 },
  { name: '60W_Street_Light', luminaire: '60W Street Light', lumens: 10200, watts: 60, peakCandela: 12000, beamSigma: 0.58 },
  { name: 'Recessed_Panel_600x600_24W', luminaire: 'Recessed Panel 600x600 24W', lumens: 3600, watts: 24, peakCandela: 2800, beamSigma: 0.95 },
  { name: '9W_Surface_Downlight', luminaire: '9W Surface Downlight', lumens: 1250, watts: 9, peakCandela: 1600, beamSigma: 0.5 },
  { name: 'Performance_Flood_175W', luminaire: 'Performance Flood 175W', lumens: 22500, watts: 175, peakCandela: 20000, beamSigma: 0.85 },
];

const seed = async () => {
  await fs.mkdir(config.iesDir, { recursive: true });
  for (const sample of SAMPLES) {
    const filename = `LumenX_${sample.name}.ies`;
    const text = buildIes(sample);
    await fs.writeFile(path.join(config.iesDir, filename), text, 'utf8');
    console.log(`[ies:seed] wrote ${filename}`);
  }
  console.log(`[ies:seed] ${SAMPLES.length} sample files -> ${config.iesDir}`);
};

seed().catch((err) => {
  console.error('[ies:seed] failed:', err.message);
  process.exit(1);
});
