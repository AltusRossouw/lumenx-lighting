import React from 'react';
import { CONTACT } from '../data';

/** Global floating WhatsApp button — rendered once in AppLayout so it appears on every page */
export const FloatingWhatsAppButton: React.FC = () => {
  const whatsappNumber = CONTACT.phone.replace(/[\s+]/g, '');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hi LumenX, I would like to discuss a lighting project.',
  )}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LumenX on WhatsApp"
      title="Chat on WhatsApp"
      className="group fixed bottom-6 right-6 z-[60] flex items-center no-underline"
    >
      {/* Expandable label pill (reveals on hover) */}
      <span className="pointer-events-none mr-3 max-w-0 overflow-hidden whitespace-nowrap rounded-full border border-[#25D366]/30 bg-[#075E54]/90 backdrop-blur-sm px-0 py-2 text-xs font-display font-semibold tracking-tight text-white opacity-0 shadow-[0_4px_24px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:max-w-[180px] group-hover:px-4 group-hover:opacity-100">
        Chat on WhatsApp
      </span>

      {/* Pulse ring */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 h-14 w-14 rounded-full border border-[#25D366]/80"
        style={{
          top: '50%',
          marginTop: '-1.75rem',
          animation: 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />

      {/* Button */}
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_6px_24px_rgba(37,211,102,0.35)] transition-transform duration-300 group-hover:scale-105">
        <img
          src="/icons/whatsapp-white.svg"
          alt=""
          className="h-7 w-7 object-contain drop-shadow-[0_0_4px_rgba(0,0,0,0.2)]"
        />
        {/* Online dot */}
        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#06090F] bg-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
      </span>
    </a>
  );
};
