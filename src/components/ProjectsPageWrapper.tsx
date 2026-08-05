import React from 'react';
import { ProjectsSection } from './ProjectsSection';
import { CTASection } from './CTASection';

interface ProjectsPageProps {
  onNavigate: (page: string) => void;
}

export const ProjectsPageWrapper: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  return (
    <div className="pt-[88px]">
      <ProjectsSection />
      <CTASection onScrollTo={(id) => onNavigate('contact')} />
    </div>
  );
};
