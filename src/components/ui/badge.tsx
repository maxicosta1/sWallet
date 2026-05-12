import * as React from "react";
import { cn } from "@/lib/utils";

const toneClass = {
  green: "bg-emerald-400/15 text-emerald-100",
  yellow: "bg-yellow-400/15 text-yellow-100",
  red: "bg-red-400/15 text-red-100",
  blue: "bg-sky-400/15 text-sky-100",
  purple: "bg-primary/15 text-purple-100",
  coral: "bg-coral/15 text-orange-100",
  muted: "bg-white/[0.06] text-muted-foreground"
};

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClass }) {
  return (
    <span
      className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold capitalize", toneClass[tone], className)}
      {...props}
    />
  );
}
