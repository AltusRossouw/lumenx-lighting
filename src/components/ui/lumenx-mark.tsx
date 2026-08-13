import React from 'react';

interface LumenXMarkProps {
  className?: string;
}

/**
 * The "X" from the LumenX logo, rendered in brand blue.
 * Used as the site-wide custom bullet / separator.
 */
export const LumenXMark: React.FC<LumenXMarkProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`shrink-0 text-primary drop-shadow-[0_0_4px_rgba(0,212,255,0.4)] ${className ?? 'w-3 h-3'}`}
  >
    <path
      d="M4.5 4.5l15 15M19.5 4.5l-15 15"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
    />
  </svg>
);
