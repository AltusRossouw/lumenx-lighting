"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface HaloPulseProps {
  children: ReactNode;
  className?: string;
  haloColor?: string;
  pulseInterval?: number;
  ringCount?: number;
}

function Ring({
  index,
  total,
  color,
  interval,
}: {
  index: number;
  total: number;
  color: string;
  interval: number;
}) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        border: `1.5px solid ${color}`,
      }}
      animate={{
        scale: [1, 2 + index * 0.3],
        opacity: [0.35, 0],
        borderWidth: [1.5, 0.3],
      }}
      transition={{
        duration: interval / 1000,
        repeat: Infinity,
        delay: (index / total) * (interval / 1000),
        ease: "easeOut",
      }}
    />
  );
}

export default function HaloPulse({
  children,
  className = "",
  haloColor = "#00D4FF",
  pulseInterval = 2000,
  ringCount = 3,
}: HaloPulseProps) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 pointer-events-none">
        {Array.from({ length: ringCount }).map((_, i) => (
          <Ring
            key={i}
            color={haloColor}
            index={i}
            interval={pulseInterval}
            total={ringCount}
          />
        ))}
      </span>
      {/* Ambient glow base */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `0 0 12px ${haloColor}44, 0 0 24px ${haloColor}22, inset 0 0 8px ${haloColor}11`,
        }}
      />
    </span>
  );
}
