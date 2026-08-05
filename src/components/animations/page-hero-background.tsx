"use client";

import React from "react";

interface PageHeroBackgroundProps {
  /** Extra class names for the container */
  className?: string;
  /** Show the blueprint grid overlay */
  grid?: boolean;
  /** Show the light ray beams */
  rays?: boolean;
  /** Show the LED dot matrix */
  dots?: boolean;
  /** Show floating light particles */
  particles?: boolean;
  /** Show ambient glow orbs */
  glows?: boolean;
  /** Grid opacity override (default 0.03) */
  gridOpacity?: number;
}

/**
 * Reusable page hero background — brings the striking blueprint/tech aesthetic
 * from the home hero to inner pages. All effects are togglable.
 */
export default function PageHeroBackground({
  className = "",
  grid = true,
  rays = true,
  dots = true,
  particles = true,
  glows = true,
  gridOpacity = 0.03,
}: PageHeroBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Blueprint grid mask */}
      {grid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,${gridOpacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,${gridOpacity}) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 70%)",
          }}
        />
      )}

      {/* Light rays */}
      {rays && (
        <>
          <div
            className="light-ray"
            style={{
              top: "-10%",
              left: "25%",
              height: "60%",
              animationDelay: "0s",
              opacity: 0.4,
            }}
          />
          <div
            className="light-ray"
            style={{
              top: "-5%",
              left: "55%",
              height: "70%",
              animationDelay: "2s",
              opacity: 0.3,
            }}
          />
          <div
            className="light-ray"
            style={{
              top: "-12%",
              left: "78%",
              height: "50%",
              animationDelay: "3.5s",
              opacity: 0.25,
            }}
          />
        </>
      )}

      {/* LED dot matrix field */}
      {dots && (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`led-${i}`}
              className="led-dot absolute"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                ["--led-duration" as string]: `${2.5 + Math.random() * 3}s`,
                ["--led-delay" as string]: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Floating light particles */}
      {particles && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className="light-particle"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${25 + Math.random() * 50}%`,
                ["--px" as string]: `${(Math.random() - 0.5) * 80}px`,
                ["--py" as string]: `${-30 - Math.random() * 60}px`,
                ["--particle-dur" as string]: `${3 + Math.random() * 4}s`,
                ["--particle-delay" as string]: `${Math.random() * 6}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Ambient glows */}
      {glows && (
        <>
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/[0.02] rounded-full blur-[120px]" />
        </>
      )}
    </div>
  );
}
