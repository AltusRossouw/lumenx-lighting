import { type ReactNode } from "react";
import { cn } from "@/src/lib/utils";

type SectionVariant = "dark" | "darker" | "elevated";
type GlowPosition = "left" | "right" | "center" | "none";

const sectionBg: Record<SectionVariant, string> = {
  dark: "bg-[#06090F]",
  darker: "bg-[#04070D]",
  elevated: "bg-[#0A101A]",
};

const glowStyles: Record<Exclude<GlowPosition, "none">, string> = {
  left: "left-[-20%] top-1/2 -translate-y-1/2",
  right: "right-[-20%] top-1/2 -translate-y-1/2",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

interface SectionProps {
  children: ReactNode;
  className?: string;
  variant?: SectionVariant;
  id?: string;
  container?: boolean;
  backgroundGlow?: GlowPosition;
  /** Show a subtle top gradient line (border-t alternative) */
  topLine?: boolean;
}

export function Section({
  children,
  className,
  variant = "dark",
  id,
  container = true,
  backgroundGlow = "none",
  topLine = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative section-padding overflow-hidden",
        sectionBg[variant],
        className
      )}
    >
      {/* Top gradient line */}
      {topLine && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      )}

      {/* Background glow orb */}
      {backgroundGlow !== "none" && (
        <div
          className={cn(
            "absolute w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[200px] pointer-events-none",
            glowStyles[backgroundGlow]
          )}
        />
      )}

      {/* Content */}
      {container ? (
        <div className="section-container relative z-10">{children}</div>
      ) : (
        <div className="relative z-10">{children}</div>
      )}
    </section>
  );
}
