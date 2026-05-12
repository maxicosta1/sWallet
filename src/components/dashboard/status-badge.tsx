import { Badge } from "@/components/ui/badge";

const toneByStatus: Record<string, "green" | "yellow" | "red" | "blue" | "purple" | "coral" | "muted"> = {
  pagado: "green",
  activo: "green",
  entregado: "green",
  pendiente: "yellow",
  interesado: "yellow",
  por_vencer: "yellow",
  vencido: "red",
  cancelado: "red",
  pausado: "red",
  lead: "purple",
  en_desarrollo: "purple",
  en_progreso: "purple",
  mantenimiento: "blue",
  revision: "coral",
  finalizado: "muted",
  activa: "green"
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={toneByStatus[status] ?? "muted"}>{status.replaceAll("_", " ")}</Badge>;
}
