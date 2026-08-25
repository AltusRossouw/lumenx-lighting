import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeroBackground } from './animations';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="pt-[88px] min-h-screen">
      <section className="relative py-24 sm:py-32 overflow-hidden bg-[#06090F]">
        <PageHeroBackground rays={false} particles={false} dots={false} />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-[11px] text-primary tracking-[0.3em] uppercase mb-4">404 — Page not found</p>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-[-0.02em] mb-4">
            This page is <span className="gradient-text">off the grid</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 font-sans font-light">
            The page you're looking for doesn't exist or may have moved. Let's get you back to the
            lighting that matters.
          </p>
          <Link to="/" className="btn btn-primary group inline-flex no-underline">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
};
