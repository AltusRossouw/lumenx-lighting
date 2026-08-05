import React from 'react';
import { WhoWeWorkWithSection } from './WhoWeWorkWithSection';
import { WhyLumenXSection } from './WhyLumenXSection';
import { ComplianceSection } from './ComplianceSection';

export const AboutPage: React.FC = () => {
  return (
    <div className="pt-[88px]">
      <WhoWeWorkWithSection />
      <WhyLumenXSection />
      <ComplianceSection />
    </div>
  );
};
