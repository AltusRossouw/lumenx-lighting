import { type ReactNode, createElement } from "react";
import { cn } from "@/src/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingAlign = "left" | "center";

interface HeadingProps {
  children: ReactNode;
  level?: HeadingLevel;
  className?: string;
  gradient?: boolean;
  align?: HeadingAlign;
  /** Optional decorative line above */
  label?: string;
}

const levelStyles: Record<HeadingLevel, string> = {
  h1: "font-display text-display-2xl text-white mb-8",
  h2: "font-display text-display-lg text-white mb-5",
  h3: "font-display text-heading-xl text-white mb-3",
  h4: "font-display text-heading-lg text-white mb-2",
};

export function Heading({
  children,
  level = "h2",
  className,
  gradient = false,
  align = "left",
  label,
}: HeadingProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={cn(alignClass, className)}>
      {label && <SectionLabel>{label}</SectionLabel>}
      {createElement(
        level,
        {
          className: cn(
            levelStyles[level],
            "text-balance tracking-[-0.02em]",
            alignClass
          ),
        },
        gradient ? (
          <span className="gradient-text">{children}</span>
        ) : (
          children
        )
      )}
    </div>
  );
}

/* ── Section Label ── */

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      <span className="w-6 h-px bg-primary/30" />
      <span className="text-label-sm text-primary/70">
        {children}
      </span>
      <span className="w-6 h-px bg-primary/30" />
    </div>
  );
}

/* ── Badge ── */

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "filled";
}

const badgeVariants: Record<string, string> = {
  default: "text-primary/70 border-primary/20 bg-primary/5",
  outline: "text-slate-500 border-slate-700",
  filled: "text-[#06090F] bg-primary border-primary",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block text-label-sm border rounded-full px-4 py-1.5",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
