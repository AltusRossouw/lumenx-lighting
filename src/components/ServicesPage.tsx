import React from 'react';
import { CompleteSolutionSection } from './CompleteSolutionSection';
import { HowWeWorkSection } from './HowWeWorkSection';
import { CTASection } from './CTASection';

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  return (
    <div className="pt-[88px]">
      <CompleteSolutionSection />
      <HowWeWorkSection />
      <CTASection onScrollTo={(id) => onNavigate('contact')} />
    </div>
  );
};
