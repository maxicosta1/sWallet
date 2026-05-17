import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "purple"
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "purple" | "coral" | "green" | "blue";
}) {
  const toneClass = {
    purple: "border-violet-300/10 bg-violet-400/[0.045]",
    coral: "border-coral/15 bg-coral/[0.055]",
    green: "border-primary/15 bg-primary/[0.055]",
    blue: "border-sky-300/15 bg-sky-400/[0.045]"
  };

  return (
    <Card className={cn("relative min-h-36 overflow-hidden p-5", toneClass[tone])}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
          <strong className="mt-3 block text-2xl font-black tracking-normal text-white">{value}</strong>
          <span className="mt-3 block text-xs text-muted-foreground">{hint}</span>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/25">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
