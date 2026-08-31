import React from 'react';
import '@orbitx/planner/planner.css';
import { LightingPlanner } from '@orbitx/planner';

/**
 * OrbitX Lighting Planner — Consumer edition (the simple 3-step estimator).
 * Lazy-loaded from App.tsx so its Tailwind v3 stylesheet never touches the
 * rest of the site.
 */
export default function PlannerPage() {
  return (
    <>
      <div className="bg-amber-400/10 border-b border-amber-400/20 px-4 py-2.5 text-center text-[11px] font-mono text-amber-300/90">
        Estimates only — results are preliminary planning estimates, not a substitute for professional lighting design or certified photometric calculations.
      </div>
      <LightingPlanner
        variant="consumer"
        accent="#00d4ff"
        proHref="/planner/pro"
        contactHref="/contact"
      />
    </>
  );
}
