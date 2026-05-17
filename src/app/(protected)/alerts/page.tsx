import Link from "next/link";
import type * as React from "react";
import { getCommercialData, type CommercialAlert } from "@/server/queries/commercial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const alertTypes = [
  { key: "invoice", label: "Facturas" },
  { key: "client", label: "Clientes" },
  { key: "project", label: "Proyectos" },
  { key: "task", label: "Tareas" },
  { key: "opportunity", label: "CRM" },
  { key: "subscription", label: "Suscripciones" },
  { key: "support", label: "Soporte" }
];

export default async function AlertsPage() {
  const data = await getCommercialData();
  const high = data.alerts.filter((alert) => alert.severity === "alta").length;
  const medium = data.alerts.filter((alert) => alert.severity === "media").length;
  const low = data.alerts.filter((alert) => alert.severity === "baja").length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Alta prioridad" value={high} />
        <Metric label="Media prioridad" value={medium} />
        <Metric label="Baja prioridad" value={low} />
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Senales inteligentes</CardDescription>
            <CardTitle>Alertas operativas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {data.alerts.length ? data.alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
                No hay alertas activas. Caja, clientes y operacion estan sin vencimientos criticos detectados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Cobertura</CardDescription>
            <CardTitle>Reglas activas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {alertTypes.map((type) => {
              const count = data.alerts.filter((alert) => alert.type === type.key).length;
              return (
                <div key={type.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase text-muted-foreground">{type.label}</p>
                    <Badge>{count}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{ruleText(type.key)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertRow({ alert }: { alert: CommercialAlert }) {
  const content = (
    <article className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong className="block text-sm text-white">{alert.title}</strong>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{alert.detail}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={alert.severity} />
          <Badge>{alert.type}</Badge>
          {alert.date ? <Badge tone="muted">{formatDate(alert.date)}</Badge> : null}
        </div>
      </div>
    </article>
  );

  if (!alert.href) return content;
  return (
    <Link href={alert.href} className="block">
      {content}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
        <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}

function ruleText(type: string) {
  const rules: Record<string, string> = {
    invoice: "Facturas vencidas con saldo pendiente.",
    client: "Clientes activos sin seguimiento reciente.",
    project: "Proyectos con riesgo o entrega cercana con bajo avance.",
    task: "Tareas vencidas o urgentes pendientes.",
    opportunity: "Oportunidades sin movimiento reciente.",
    subscription: "Renovaciones recurrentes dentro de 30 dias.",
    support: "Dominio o hosting con vencimiento proximo."
  };
  return rules[type] ?? "Regla operativa.";
}
