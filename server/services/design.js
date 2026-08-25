// Lighting design calculation — simplified lumen method.
// Functional: pure functions, no classes.

// Utilization factor estimate by room cavity ratio is intentionally simplified;
// this is a design aid, not a full photometric calculation.
const estimateUtilizationFactor = (roomLength, roomWidth, workingPlaneHeight, mountingHeight) => {
  const h = Math.max(mountingHeight - workingPlaneHeight, 0.5);
  const rcr = (5 * h * (roomLength + roomWidth)) / (roomLength * roomWidth);
  // Higher room cavity ratios scatter more light away from the task plane.
  return Math.min(0.9, Math.max(0.3, 0.82 - rcr * 0.06));
};

// lumen method: N = (E * A) / (Φ * UF * MF)
export const calculateLuminaireCount = ({
  roomLength,
  roomWidth,
  targetLux,
  lumensPerFixture,
  wattsPerFixture = 0,
  maintenanceFactor,
  workingPlaneHeight,
  mountingHeight,
}) => {
  const area = roomLength * roomWidth;
  const uf = estimateUtilizationFactor(roomLength, roomWidth, workingPlaneHeight, mountingHeight);
  const mf = maintenanceFactor;
  const luminousFlux = lumensPerFixture * uf * mf;
  const count = luminousFlux > 0 ? Math.ceil((targetLux * area) / luminousFlux) : 0;

  const installedLumens = count * lumensPerFixture;
  const achievedLux = area > 0 ? (installedLumens * uf * mf) / area : 0;
  const powerDensity = area > 0 ? (count * wattsPerFixture) / area : 0;

  return {
    area: Number(area.toFixed(2)),
    utilizationFactor: Number(uf.toFixed(3)),
    maintenanceFactor: mf,
    requiredCount: count,
    achievedLux: Number(achievedLux.toFixed(1)),
    installedLumens: Number(installedLumens.toFixed(0)),
    powerDensityWm2: Number(powerDensity.toFixed(2)),
    wattsPerFixture: wattsPerFixture,
  };
};
