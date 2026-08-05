"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface NeonTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  color?: string;
  glowColor?: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  once?: boolean;
}

export default function NeonText({
  children,
  as: Tag = "h1",
  color = "#00D4FF",
  glowColor = "rgba(0, 212, 255, 0.8)",
  className = "",
  delay = 0,
  staggerChildren = 0.04,
  once = true,
}: NeonTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  const chars = children.split("");

  return (
    <Tag ref={ref as any} className={className}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" className="inline-flex flex-wrap">
        {chars.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            initial={{
              opacity: 0,
              textShadow: `0 0 0px transparent, 0 0 0px transparent`,
              color: "rgba(255,255,255,0.08)",
            }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    color: [
                      "rgba(255,255,255,0.08)",
                      color,
                      color,
                      color,
                      "#FFFFFF",
                      color,
                    ],
                    textShadow: [
                      `0 0 0px transparent, 0 0 0px transparent`,
                      `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
                      `0 0 2px ${glowColor}, 0 0 4px ${glowColor}`,
                      `0 0 4px ${glowColor}, 0 0 12px ${glowColor}`,
                      `0 0 4px ${glowColor}, 0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
                    ],
                  }
                : {}
            }
            transition={{
              duration: 0.8,
              delay: delay + i * staggerChildren,
              ease: [0.16, 1, 0.3, 1],
              color: {
                duration: 1.2,
                delay: delay + i * staggerChildren,
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              },
              textShadow: {
                duration: 1.0,
                delay: delay + i * staggerChildren,
                times: [0, 0.25, 0.5, 0.75, 1],
              },
            }}
            className={char === " " ? "w-[0.3em]" : ""}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    </Tag>
  );
}
