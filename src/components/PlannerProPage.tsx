import React from 'react';
import '@orbitx/planner/planner.css';
import { LightingPlanner } from '@orbitx/planner';

/**
 * OrbitX Lighting Planner — Pro edition (the full DIALux-inspired tool).
 * Reached via the Consumer edition's "Open in Pro mode" link.
 */
export default function PlannerProPage() {
  return <LightingPlanner variant="pro" accent="#00d4ff" homeHref="/planner" />;
}
