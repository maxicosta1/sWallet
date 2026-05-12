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
    purple: "from-primary/25",
    coral: "from-coral/25",
    green: "from-emerald-400/20",
    blue: "from-sky-400/20"
  };

  return (
    <Card className={cn("relative min-h-36 overflow-hidden p-5", toneClass[tone])}>
      <div className="absolute -bottom-14 -right-12 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <strong className="mt-3 block text-2xl font-black tracking-tight text-white">{value}</strong>
          <span className="mt-3 block text-xs text-muted-foreground">{hint}</span>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
