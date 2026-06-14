import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — platform-aware variants.
 *
 * Fluent UI 2 (web):
 *   - "fluent-primary"   : filled accent, 4px radius, 36px height
 *   - "fluent-secondary" : outlined, 4px radius
 *   - "fluent-subtle"    : ghost with hover fill
 *
 * Apple HIG (mobile):
 *   - "ios-primary"      : filled, rounded-full, 50px height
 *   - "ios-secondary"    : tinted, rounded-full
 *   - "ios-plain"        : plain text, no background
 *   - "ios-destructive"  : red filled, rounded-full
 *
 * Neutral variants (work on both platforms):
 *   default, destructive, outline, secondary, ghost, link, gold, glass
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* ── Brand-neutral ─────────────────────────────────────────── */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius,0.25rem)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[var(--radius,0.25rem)]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-[var(--radius,0.25rem)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-[var(--radius,0.25rem)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground rounded-[var(--radius,0.25rem)]",
        link:
          "text-primary underline-offset-4 hover:underline",
        // gold — remote updated version (solid, no gradient)
        gold:
          "bg-[hsl(43,100%,50%)] text-[hsl(225,60%,12%)] hover:bg-[hsl(43,100%,56%)] active:bg-[hsl(43,100%,44%)] shadow-sm font-semibold transition-colors rounded-[var(--radius,0.25rem)]",
        glass:
          "bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-foreground rounded-[var(--radius,0.25rem)]",

        /* ── Fluent UI 2 ───────────────────────────────────────────── */
        "fluent-primary":
          "rounded-fluent-sm bg-primary text-primary-foreground h-9 px-3 " +
          "hover:bg-primary/90 active:bg-primary/80 " +
          "shadow-[var(--elev-1)] hover:shadow-[var(--elev-2)] " +
          "transition-[background,box-shadow] duration-100",

        "fluent-secondary":
          "rounded-fluent-sm border border-input bg-background h-9 px-3 " +
          "hover:bg-[var(--fluent-fill-hover,rgba(0,0,0,0.06))] hover:border-border " +
          "active:bg-[var(--fluent-fill-pressed,rgba(0,0,0,0.10))] " +
          "transition-[background,border-color] duration-100",

        "fluent-subtle":
          "rounded-fluent-sm bg-transparent text-foreground h-9 px-3 " +
          "hover:bg-[var(--fluent-fill-subtle,rgba(0,0,0,0.04))] " +
          "active:bg-[var(--fluent-fill-hover,rgba(0,0,0,0.06))] " +
          "transition-colors duration-100",

        /* ── Apple HIG (iOS) ───────────────────────────────────────── */
        "ios-primary":
          "rounded-full bg-primary text-primary-foreground h-[50px] px-6 " +
          "font-semibold text-[17px] tracking-tight " +
          "active:opacity-80 active:scale-[0.97] " +
          "transition-[opacity,transform] duration-150",

        "ios-secondary":
          "rounded-full bg-primary/12 text-primary h-[50px] px-6 " +
          "font-semibold text-[17px] tracking-tight " +
          "active:opacity-70 active:scale-[0.97] " +
          "transition-[opacity,transform] duration-150",

        "ios-plain":
          "rounded-full text-primary h-[44px] px-4 " +
          "font-medium text-[17px] " +
          "active:opacity-50 transition-opacity duration-100",

        "ios-destructive":
          "rounded-full bg-destructive text-destructive-foreground h-[50px] px-6 " +
          "font-semibold text-[17px] tracking-tight " +
          "active:opacity-80 active:scale-[0.97] " +
          "transition-[opacity,transform] duration-150",
      },

      size: {
        default:     "h-10 px-4 py-2",
        sm:          "h-8 rounded-[var(--radius,0.25rem)] px-3 text-xs",
        lg:          "h-11 rounded-[var(--radius,0.25rem)] px-6 text-base",
        xl:          "h-14 rounded-[var(--radius,0.25rem)] px-10 text-lg",
        icon:        "h-10 w-10 rounded-[var(--radius,0.25rem)]",
        "fluent-sm": "h-8  px-3 text-[13px]",
        "fluent-md": "h-9  px-3 text-sm",
        "fluent-lg": "h-10 px-4 text-[15px]",
        "ios-touch": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
