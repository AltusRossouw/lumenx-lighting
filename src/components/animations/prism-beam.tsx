"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface PrismBeamProps {
  className?: string;
  count?: number;
  colors?: string[];
  beamWidth?: number;
  beamGap?: number;
}

export default function PrismBeam({
  className = "",
  count = 4,
  colors = ["#00D4FF", "#60A5FA", "#5165FF", "#818CF8"],
  beamWidth = 3,
  beamGap = 60,
}: PrismBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 20%"],
  });

  const intensity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scaleX = useTransform(scrollYProgress, [0, 0.3, 1], [0.3, 1, 1.2]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 flex items-center justify-center gap-0"
        style={{ opacity: intensity, scaleX }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const color = colors[i % colors.length];
          const offset = (i - (count - 1) / 2) * beamGap;

          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `calc(50% + ${offset}px)`,
                width: beamWidth,
                height: "100%",
                transformOrigin: "center",
                background: `linear-gradient(
                  180deg,
                  transparent 0%,
                  ${color}44 10%,
                  ${color} 30%,
                  #FFFFFF 50%,
                  ${color} 70%,
                  ${color}44 90%,
                  transparent 100%
                )`,
                boxShadow: `
                  0 0 ${beamWidth * 3}px ${color}66,
                  0 0 ${beamWidth * 6}px ${color}33,
                  ${beamWidth * 2}px 0 ${beamWidth * 3}px ${color}22,
                  -${beamWidth * 2}px 0 ${beamWidth * 3}px ${color}22
                `,
                filter: `blur(${beamWidth * 0.15}px)`,
              }}
            />
          );
        })}

        {/* Center convergence glow */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 60,
            height: 60,
            background:
              "radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(81,101,255,0.1) 40%, transparent 70%)",
            boxShadow:
              "0 0 40px rgba(0,212,255,0.2), 0 0 80px rgba(0,212,255,0.1)",
          }}
        />
      </motion.div>
    </div>
  );
}
