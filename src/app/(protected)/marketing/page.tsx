import type * as React from "react";
import { getCommercialData } from "@/server/queries/commercial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { MarketingCampaignForm } from "@/components/forms/commercial-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const data = await getCommercialData();
  const contacts = data.campaigns.reduce((sum, campaign) => sum + campaign.contacts, 0);
  const responses = data.campaigns.reduce((sum, campaign) => sum + campaign.responses, 0);
  const meetings = data.campaigns.reduce((sum, campaign) => sum + campaign.meetings, 0);
  const sales = data.campaigns.reduce((sum, campaign) => sum + campaign.sales, 0);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Contactos" value={contacts} />
        <Metric label="Tasa respuesta" value={`${percent(responses, contacts)}%`} />
        <Metric label="Reuniones" value={meetings} />
        <Metric label="Ventas" value={sales} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Marketing</CardDescription>
              <CardTitle>Nueva campana</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <MarketingCampaignForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Rendimiento comercial</CardDescription>
              <CardTitle>Campanas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Campana", "Rubro", "Estado", "Respuesta", "Reuniones", "Cierre", "Pipeline"]}
              rows={data.campaigns.map((campaign) => [
                <div key="name" className="grid gap-1">
                  <strong>{campaign.name}</strong>
                  <span className="text-xs text-muted-foreground">{formatDate(campaign.date)}</span>
                </div>,
                campaign.target,
                <StatusBadge key="status" status={campaign.status} />,
                `${campaign.responseRate}%`,
                `${campaign.meetingRate}%`,
                `${campaign.closingRate}%`,
                <div key="pipeline" className="grid gap-1">
                  <CurrencyAmount value={campaign.estimatedPipeline} currency="ARS" />
                  <span className="text-xs text-muted-foreground">{campaign.opportunityCount} oportunidades</span>
                </div>
              ])}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Lectura rapida</CardDescription>
            <CardTitle>Embudo agregado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <FunnelStep label="Contactos" value={contacts} />
            <FunnelStep label="Respuestas" value={responses} badge={`${percent(responses, contacts)}%`} />
            <FunnelStep label="Reuniones" value={meetings} badge={`${percent(meetings, responses)}%`} />
            <FunnelStep label="Ventas" value={sales} badge={`${percent(sales, meetings)}%`} />
          </div>
        </CardContent>
      </Card>
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

function FunnelStep({ label, value, badge }: { label: string; value: number; badge?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
        {badge ? <Badge>{badge}</Badge> : null}
      </div>
      <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
    </div>
  );
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
