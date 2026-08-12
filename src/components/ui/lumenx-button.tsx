import { forwardRef, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-display font-semibold text-sm tracking-wide whitespace-nowrap transition-all duration-300 outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06090F] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-[#06090F] hover:shadow-[0_0_30px_rgba(0,212,255,0.35)] active:scale-[0.98] relative overflow-hidden",
        secondary:
          "border border-white/10 bg-white/[0.02] text-slate-300 hover:text-white hover:border-primary/25 hover:bg-white/[0.04]",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/[0.04]",
        link: "text-primary/70 hover:text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-xs gap-1.5 rounded-lg",
        md: "h-11 px-6 text-sm gap-2 rounded-lg",
        lg: "h-13 px-8 text-sm gap-2.5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, iconLeading, iconTrailing, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn("group/button", buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Sliding hover overlay for primary variant */}
        {variant === "primary" && (
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/button:translate-y-0 transition-transform duration-300" />
        )}
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          iconLeading
        )}
        <span className="relative z-10">{children}</span>
        {!loading && iconTrailing}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
