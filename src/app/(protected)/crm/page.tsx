import type * as React from "react";
import { getCommercialData } from "@/server/queries/commercial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { OpportunityForm, OpportunityStatusForm } from "@/components/forms/commercial-forms";

export const dynamic = "force-dynamic";

const pipelineColumns = [
  { key: "nuevo", label: "Lead nuevo" },
  { key: "contacto", label: "Contactado" },
  { key: "reunion_agendada", label: "Reunion" },
  { key: "negociacion", label: "Negociacion" },
  { key: "ganado", label: "Ganado" },
  { key: "perdido", label: "Perdido" }
];

export default async function CrmPage() {
  const data = await getCommercialData();
  const openOpportunities = data.opportunities.filter((opportunity) => opportunity.status !== "ganado" && opportunity.status !== "perdido");
  const pipelineARS = openOpportunities.filter((opportunity) => opportunity.currency === "ARS").reduce((sum, opportunity) => sum + opportunity.value, 0);
  const weightedARS = openOpportunities
    .filter((opportunity) => opportunity.currency === "ARS")
    .reduce((sum, opportunity) => sum + opportunity.value * (opportunity.probability / 100), 0);
  const won = data.opportunities.filter((opportunity) => opportunity.status === "ganado").length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Oportunidades abiertas" value={openOpportunities.length} />
        <Metric label="Pipeline ARS" value={<CurrencyAmount value={pipelineARS} currency="ARS" />} />
        <Metric label="Pipeline ponderado" value={<CurrencyAmount value={weightedARS} currency="ARS" />} />
        <Metric label="Ventas ganadas" value={won} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.74fr_1.26fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Ventas</CardDescription>
              <CardTitle>Nueva oportunidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <OpportunityForm clients={data.clients} campaigns={data.campaignOptions} teamMembers={data.teamMembers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Pipeline comercial</CardDescription>
              <CardTitle>CRM</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 xl:grid-cols-6">
              {pipelineColumns.map((column) => {
                const opportunities = data.opportunities.filter((opportunity) => opportunity.status === column.key);
                return (
                  <section key={column.key} className="grid content-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-white">{column.label}</h3>
                      <Badge>{opportunities.length}</Badge>
                    </div>
                    {opportunities.map((opportunity) => (
                      <article key={opportunity.id} className="grid gap-3 rounded-2xl border border-white/10 bg-[#10111d] p-3">
                        <div>
                          <strong className="block text-sm text-white">{opportunity.title}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">{opportunity.clientName}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={opportunity.status} />
                          {opportunity.campaignName ? <Badge tone="blue">{opportunity.campaignName}</Badge> : null}
                        </div>
                        <div className="grid gap-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{opportunity.probability}% prob.</span>
                            <CurrencyAmount value={opportunity.value} currency={opportunity.currency} />
                          </div>
                          <Progress value={opportunity.probability} />
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {opportunity.service} - {opportunity.responsibleName}
                        </p>
                        {opportunity.nextAction ? <p className="text-xs text-white/75">{opportunity.nextAction}</p> : null}
                        <OpportunityStatusForm opportunityId={opportunity.id} status={opportunity.status} />
                      </article>
                    ))}
                  </section>
                );
              })}
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
        <strong className="mt-2 block text-xl font-black text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}
