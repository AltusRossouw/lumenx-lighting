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
    <LightingPlanner
      variant="consumer"
      accent="#00d4ff"
      proHref="/planner/pro"
      contactHref="/contact"
    />
  );
}
