import React from 'react';
import { LumenXMark } from './ui/lumenx-mark';

export const ACCREDITATIONS = [
  'Specification Value Engineering',
  'Nationwide',
  'B-BBEE Level 2',
  'SABS / IEC / OSHACT Aligned',
  'Manufacturer-Backed Warranties',
];

interface AccreditationBarProps {
  /** 'hover' — dark bar, items tint brand blue on hover. 'strip' — solid white bar with bold black text. */
  variant?: 'hover' | 'strip';
}

/**
 * Accreditation / proof bar. Two design variants are available for A/B comparison:
 *  - Variant 1 ("hover"): items change to brand blue on hover.
 *  - Variant 2 ("strip"): solid white/gray strip spanning the page with bold black text.
 */
export const AccreditationBar: React.FC<AccreditationBarProps> = ({ variant = 'hover' }) => {
  if (variant === 'strip') {
    return (
      <section className="relative bg-[#F4F6F9] py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            {ACCREDITATIONS.map((item, i) => (
              <React.Fragment key={item}>
                {i > 0 && <LumenXMark className="w-3 h-3" />}
                <span className="font-display text-sm sm:text-base font-extrabold text-[#0A0D14] tracking-tight uppercase">
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-6 border-y border-[#1E293B]/60 bg-[#04070D] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {ACCREDITATIONS.map((item) => (
            <span
              key={item}
              className="group flex items-center gap-2 px-2.5 py-1 text-[11px] sm:text-xs font-mono uppercase tracking-[0.14em] text-slate-500 hover:text-primary transition-colors duration-300 cursor-default"
            >
              <LumenXMark className="w-2.5 h-2.5 text-slate-700 group-hover:text-primary transition-colors duration-300" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
