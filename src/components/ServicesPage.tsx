import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CompleteSolutionSection } from './CompleteSolutionSection';
import { HowWeWorkSection } from './HowWeWorkSection';
import { CTASection } from './CTASection';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="pt-[88px]">
      <CompleteSolutionSection />
      <HowWeWorkSection />
      <CTASection />
    </div>
  );
};
