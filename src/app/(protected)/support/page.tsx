import Link from "next/link";
import type * as React from "react";
import { getDocumentsSupportData } from "@/server/queries/documents-support";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SupportPlanForm } from "@/components/forms/documents-support-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const data = await getDocumentsSupportData();
  const active = data.supportPlans.filter((plan) => plan.status !== "cancelado" && plan.status !== "inactivo").length;
  const expiring = data.supportPlans.filter((plan) => plan.renewalState === "por_vencer" || plan.renewalState === "vencido").length;
  const monthlyARS = data.supportPlans
    .filter((plan) => plan.currency === "ARS" && plan.status !== "cancelado")
    .reduce((sum, plan) => sum + plan.monthlyPrice, 0);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Planes activos" value={active} />
        <Metric label="Vencimientos" value={expiring} />
        <Metric label="MRR ARS" value={<CurrencyAmount value={monthlyARS} currency="ARS" />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Soporte</CardDescription>
              <CardTitle>Nuevo mantenimiento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <SupportPlanForm clients={data.clients} projects={data.projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Mantenimiento post-entrega</CardDescription>
              <CardTitle>Planes, dominios y hosting</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Cliente", "Proyecto", "Dominio", "Hosting", "Proximo vencimiento", "Mensual", "Estado"]}
              rows={data.supportPlans.map((plan) => [
                plan.clientName,
                plan.projectName ?? "Sin proyecto",
                plan.url && plan.url !== "#" ? (
                  <Link key="domain" href={plan.url} className="font-bold text-primary">
                    {plan.domain}
                  </Link>
                ) : (
                  plan.domain
                ),
                plan.hosting,
                plan.nextRenewal ? formatDate(plan.nextRenewal) : "Sin fecha",
                <CurrencyAmount key="price" value={plan.monthlyPrice} currency={plan.currency} />,
                <StatusBadge key="status" status={plan.renewalState === "normal" ? plan.status : plan.renewalState} />
              ])}
              empty="Todavia no hay planes de soporte cargados."
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Alertas de renovacion</CardDescription>
              <CardTitle>Proximos 30 dias</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.supportAlerts.length ? data.supportAlerts.map((alert) => (
                <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <strong className="block text-sm text-white">{alert.title}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatDate(alert.date)}</span>
                  </div>
                  <StatusBadge status={alert.severity} />
                </div>
              )) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
                  No hay renovaciones criticas en los proximos 30 dias.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Control operativo</CardDescription>
              <CardTitle>Cobertura de soporte</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.supportPlans.slice(0, 8).map((plan) => (
                <article key={plan.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm text-white">{plan.clientName}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">{plan.plan}</span>
                    </div>
                    <Badge>{plan.status}</Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Dominio: {plan.domainRenewal ? formatDate(plan.domainRenewal) : "sin fecha"} - Hosting: {plan.hostingRenewal ? formatDate(plan.hostingRenewal) : "sin fecha"}
                  </p>
                  {plan.notes ? <p className="text-xs leading-5 text-white/75">{plan.notes}</p> : null}
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
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
