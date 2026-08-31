import React from 'react';
import { ProjectsSection } from './ProjectsSection';
import { CTASection } from './CTASection';

export const ProjectsPageWrapper: React.FC = () => {
  return (
    <div className="pt-[104px]">
      <ProjectsSection />
      <CTASection />
    </div>
  );
};
