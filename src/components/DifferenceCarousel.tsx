import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WHY_CHOOSE } from '../data';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { LumenXMark } from './ui/lumenx-mark';

const AUTO_ADVANCE_MS = 5000;

/**
 * Single text carousel consolidating the "LumenX difference" statements.
 * Positioned immediately below the hero; rotates through one differentiator
 * at a time with manual controls and auto-advance.
 */
export const DifferenceCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const count = WHY_CHOOSE.length;

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [paused, count]);

  const active = WHY_CHOOSE[index];

  return (
    <section
      aria-label="The LumenX difference"
      className="relative py-14 sm:py-16 overflow-hidden bg-[#04070D] border-b border-[#1E293B]/60"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <LumenXMark className="w-3 h-3 text-primary" />
            <h2 className="font-display text-sm sm:text-base font-bold tracking-[0.14em] uppercase text-slate-300">
              The <span className="gradient-text">LumenX</span> difference
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume carousel' : 'Pause carousel'}
              className="w-8 h-8 flex items-center justify-center border border-[#1E293B]/70 text-slate-400 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous difference"
              className="w-8 h-8 flex items-center justify-center border border-[#1E293B]/70 text-slate-400 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next difference"
              className="w-8 h-8 flex items-center justify-center border border-[#1E293B]/70 text-slate-400 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide */}
        <div className="relative min-h-[132px] sm:min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 md:gap-8 items-start"
            >
              <div className="w-14 h-14 bg-primary/[0.06] border border-primary/10 flex items-center justify-center shrink-0">
                <img
                  src={active.iconImg}
                  alt=""
                  className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.35)]"
                />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                  {active.title}
                </h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-3xl font-sans font-light">
                  {active.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2 mt-8">
          {WHY_CHOOSE.map((reason, i) => (
            <button
              key={reason.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show: ${reason.title}`}
              aria-current={i === index}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                i === index ? 'w-8 bg-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]' : 'w-3 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
