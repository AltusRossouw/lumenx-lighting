import { type ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface CardProps {
  children?: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
  as?: "div" | "article" | "button";
  onClick?: () => void;
}

export function Card({ children, className, variant = "default", as: Tag = "div", onClick }: CardProps) {
  const variants: Record<string, string> = {
    default: "gradient-border-card card-lift",
    elevated: "bg-[#0A101A] rounded-2xl border border-[#1E293B] shadow-[var(--shadow-card)]",
    interactive:
      "gradient-border-card card-lift cursor-pointer hover:border-primary/20",
  };

  return (
    <Tag
      className={cn(variants[variant], "overflow-hidden", className)}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

/* ── Card sub-components for structured layout ── */

interface CardImageProps {
  imageUrl: string;
  className?: string;
  height?: string;
}

export function CardImage({ imageUrl, className, height = "h-52" }: CardImageProps) {
  return (
    <div className={cn(height, "overflow-hidden relative", className)}>
      <div
        className="absolute inset-0 bg-cover bg-center group-hover/card:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A101A] via-transparent to-transparent" />
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("mt-auto pt-4 border-t border-[#1E293B] flex items-center gap-4", className)}>
      {children}
    </div>
  );
}
