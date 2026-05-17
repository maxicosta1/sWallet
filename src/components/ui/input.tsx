import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-black/35 focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
