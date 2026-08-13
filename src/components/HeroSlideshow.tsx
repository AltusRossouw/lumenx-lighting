import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HERO_SLIDES } from '../data';

const SLIDE_DURATION_MS = 6000; // time each slide is shown
const FADE_SECONDS = 1.4; // crossfade duration

/**
 * Full-bleed crossfading background slideshow of LumenX installation photography.
 * Auto-advances with a subtle Ken Burns zoom, pauses on hover, and exposes
 * clickable slide indicators. Respects prefers-reduced-motion.
 */
export const HeroSlideshow: React.FC = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const count = HERO_SLIDES.length;
  const reduceMotion = useReducedMotion();

  // Pause the crossfade when the hero scrolls out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView || count <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, SLIDE_DURATION_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [paused, inView, count]);

  const goTo = (i: number) => setActive(((i % count) + count) % count);

  const zoomScale = reduceMotion ? 1 : 1.07;
  const zoomSeconds = (SLIDE_DURATION_MS + FADE_SECONDS * 1000) / 1000;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      role="region"
      aria-label="LumenX lighting installation photography"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Crossfading slides */}
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === active;
        return (
          <motion.div
            key={slide.src}
            initial={{ opacity: isActive ? 1 : 0, scale: 1 }}
            animate={{ opacity: isActive ? 1 : 0, scale: isActive ? zoomScale : 1 }}
            transition={{
              opacity: { duration: FADE_SECONDS, ease: 'easeInOut' },
              scale: isActive
                ? { duration: zoomSeconds, ease: 'linear' }
                : { duration: FADE_SECONDS, ease: 'easeOut' },
            }}
            className="absolute inset-0"
            aria-hidden={!isActive}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              draggable={false}
              className="w-full h-full object-cover"
            />
          </motion.div>
        );
      })}

      {/* Current slide category label */}
      <div className="absolute bottom-24 right-5 sm:right-8 z-20 hidden sm:block pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-[#06090F]/70 backdrop-blur-sm border border-primary/25 text-[9px] font-mono text-primary uppercase tracking-[0.22em]">
          {HERO_SLIDES[active].category}
        </span>
      </div>

      {/* Vertical slide indicator rail */}
      <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-2.5">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show installation: ${slide.application}`}
            aria-current={i === active}
            className="group flex items-center cursor-pointer"
          >
            <span
              className={`block rounded-full transition-all duration-500 ${
                i === active
                  ? 'h-6 w-1.5 bg-primary shadow-[0_0_10px_rgba(0,212,255,0.6)]'
                  : 'h-1.5 w-1.5 bg-slate-600/70 group-hover:bg-slate-400'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
