"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

type RevealDirection = "up" | "down" | "left" | "right";
type RevealDistance = "sm" | "md" | "lg";

const directionMap: Record<RevealDirection, { x?: number | string; y?: number | string }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
};

const distanceMap: Record<RevealDistance, number> = {
  sm: 20,
  md: 40,
  lg: 60,
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  distance?: RevealDistance;
  delay?: number;
  duration?: number;
  once?: boolean;
  /** Stagger children with this delay increment */
  staggerDelay?: number;
  /** Make sibling elements stagger */
  stagger?: boolean;
}

export function Reveal({
  children,
  className,
  direction = "up",
  distance = "md",
  delay = 0,
  duration = 0.7,
  once = true,
}: RevealProps) {
  const dir = directionMap[direction];
  const dist = distanceMap[distance];

  // Scale distance based on direction axis
  const initial = {
    opacity: 0,
    ...(dir.x !== undefined ? { x: dir.x === 0 ? 0 : Math.sign(Number(dir.x)) * dist } : {}),
    ...(dir.y !== undefined ? { y: dir.y === 0 ? 0 : Math.sign(Number(dir.y)) * dist } : {}),
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={{
        hidden: initial,
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration,
            delay,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
