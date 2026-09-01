import React from 'react';
import { LumenXMark } from './ui/lumenx-mark';

/**
 * The single, consolidated social-proof bar shown directly under the hero.
 * Runs as a seamless marquee so every trust point can live here without
 * crowding, and is the ONLY place these points appear on the page.
 */
export const ACCREDITATIONS = [
  'Nationwide Delivery',
  'B-BBEE Level 2',
  'SABS, IEC and OHSACT Aligned',
  'Manufacturer-Backed Warranties',
  'Lighting Simulations & Calculations',
  'Specification & Value Engineering',
];

const Row: React.FC = () => (
  <div className="flex items-center shrink-0">
    {ACCREDITATIONS.map((item) => (
      <span key={item} className="flex items-center shrink-0">
        <span className="font-display text-sm sm:text-base font-extrabold text-[#0A0D14] tracking-tight uppercase whitespace-nowrap">
          {item}
        </span>
        <LumenXMark className="w-3 h-3 mx-6 shrink-0" />
      </span>
    ))}
  </div>
);

export const AccreditationBar: React.FC = () => (
  <section aria-label="Accreditations" className="relative bg-[#F4F6F9] py-5 overflow-hidden">
    <div className="marquee-track">
      <Row />
      <Row />
    </div>
  </section>
);
