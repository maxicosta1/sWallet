import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-black/35 focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
