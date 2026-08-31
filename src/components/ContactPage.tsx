import React from 'react';
import { ContactSection } from './ContactSection';
import { FAQSection } from './FAQSection';

export const ContactPage: React.FC = () => {
  return (
    <div className="pt-[104px]">
      <ContactSection />
      <FAQSection />
    </div>
  );
};
