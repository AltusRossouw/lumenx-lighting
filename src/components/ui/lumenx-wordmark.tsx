import React from 'react';
import { LOGO_URL } from '../../data';

interface LumenXWordmarkProps {
  /** Additional classes (e.g. a fixed height when used standalone). */
  className?: string;
  alt?: string;
}

/**
 * The high-resolution LumenX wordmark, sized to sit inline with surrounding
 * text (it scales with the element's font-size via `em` units). Used to replace
 * raw text instances of the company name on the Contact and About pages.
 */
export const LumenXWordmark: React.FC<LumenXWordmarkProps> = ({
  className = '',
  alt = 'LumenX',
}) => (
  <img
    src={LOGO_URL}
    alt={alt}
    referrerPolicy="no-referrer"
    draggable={false}
    className={`inline-block h-[1.25em] w-auto align-[-0.28em] object-contain ${className}`}
  />
);

/**
 * Render a plain string, replacing every "LumenX" occurrence with the inline
 * wordmark logo. Used for data-driven copy such as FAQ questions/answers.
 */
export const renderWithLogo = (text: string): React.ReactNode => {
  const parts = String(text).split('LumenX');
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && <LumenXWordmark className="mx-[0.08em]" />}
    </React.Fragment>
  ));
};
