"use client";

import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUploader({ className }: { className?: string }) {
  return (
    <label
      className={cn(
        "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-center text-sm text-muted-foreground transition hover:border-primary/45 hover:bg-primary/10",
        className
      )}
    >
      <UploadCloud className="h-6 w-6 text-primary" />
      <span>Adjuntar comprobantes o archivos internos</span>
      <input type="file" className="hidden" multiple />
    </label>
  );
}
