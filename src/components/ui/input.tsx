/**
 * Input — platform-aware text field.
 *
 * Fluent UI 2 (web):  4px radius, 1px border, bottom accent on focus.
 * Apple HIG (mobile): 10px radius, filled tray bg, 44px touch height.
 *
 * Platform differences are applied via CSS in index.css targeting
 * [data-platform="fluent"] input.lt-input and
 * [data-platform="hig"]    input.lt-input
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, dir, inputMode, ...props }, ref) => {
    const isNumeric = type === "number";
    return (
      <input
        type={type}
        dir={isNumeric ? "ltr" : dir}
        inputMode={isNumeric ? (inputMode ?? "decimal") : inputMode}
        className={cn(
          "lt-input",
          "flex h-10 w-full rounded-[var(--radius,0.25rem)] border border-input",
          "bg-background px-3 py-2 text-base text-foreground",
          "ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-[border-color,box-shadow] duration-100",
          isNumeric && "text-left [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
