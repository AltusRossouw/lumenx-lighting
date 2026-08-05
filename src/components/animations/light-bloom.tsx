"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

interface LightBloomProps {
  children: ReactNode;
  className?: string;
  bloomColor?: string;
  bloomIntensity?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export default function LightBloom({
  children,
  className = "",
  bloomColor = "#00D4FF",
  bloomIntensity = 0.5,
  delay = 0,
  duration = 1,
  once = true,
}: LightBloomProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Bloom halo overlay */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
        variants={{
          hidden: {
            opacity: 0,
            boxShadow: `0 0 0px ${bloomColor}00, inset 0 0 0px ${bloomColor}00`,
          },
          visible: {
            opacity: [
              0, bloomIntensity * 1.2, bloomIntensity * 0.6, bloomIntensity,
            ],
            boxShadow: [
              `0 0 0px ${bloomColor}00, inset 0 0 0px ${bloomColor}00`,
              `0 0 30px ${bloomColor}44, 0 0 60px ${bloomColor}22, inset 0 0 15px ${bloomColor}11`,
              `0 0 15px ${bloomColor}33, 0 0 30px ${bloomColor}15, inset 0 0 8px ${bloomColor}08`,
              `0 0 20px ${bloomColor}22, 0 0 40px ${bloomColor}11, inset 0 0 6px ${bloomColor}05`,
            ],
          },
        }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
          opacity: {
            duration: duration * 1.2,
            times: [0, 0.15, 0.4, 1],
          },
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 h-full"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: duration * 0.8,
              delay: delay + 0.1,
              ease: [0.16, 1, 0.3, 1],
            },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
