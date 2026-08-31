import React from 'react';
import '@orbitx/planner/planner.css';
import { LightingPlanner } from '@orbitx/planner';

/**
 * OrbitX Lighting Planner — Pro edition (the full DIALux-inspired tool).
 * Reached via the Consumer edition's "Open in Pro mode" link.
 */
export default function PlannerProPage() {
  return (
    <>
      <div className="bg-amber-400/10 border-b border-amber-400/20 px-4 py-2.5 text-center text-[11px] font-mono text-amber-300/90">
        Estimates only — results are preliminary planning estimates, not a substitute for professional lighting design or certified photometric calculations.
      </div>
      <LightingPlanner variant="pro" accent="#00d4ff" homeHref="/planner" />
    </>
  );
}
