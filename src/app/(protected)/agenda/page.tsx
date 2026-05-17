import Link from "next/link";
import type * as React from "react";
import { getCommercialData } from "@/server/queries/commercial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CalendarEventForm, CalendarEventStatusForm } from "@/components/forms/commercial-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const data = await getCommercialData();
  const today = new Date();
  const upcoming = data.agendaItems.filter((item) => item.date >= startOfDay(today)).slice(0, 20);
  const overdue = data.agendaItems.filter((item) => item.date < startOfDay(today) && item.status !== "completado" && item.status !== "pagada").length;
  const urgent = data.agendaItems.filter((item) => item.priority === "urgente" || item.priority === "alta").length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Proximos eventos" value={upcoming.length} />
        <Metric label="Vencidos" value={overdue} />
        <Metric label="Alta prioridad" value={urgent} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.74fr_1.26fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Agenda</CardDescription>
              <CardTitle>Nuevo evento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarEventForm clients={data.clients} projects={data.projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Fechas accionables</CardDescription>
              <CardTitle>Agenda unificada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Fecha", "Tipo", "Titulo", "Detalle", "Prioridad", "Estado"]}
              rows={upcoming.map((item) => [
                formatDate(item.date),
                item.type.replaceAll("_", " "),
                item.href ? (
                  <Link key="title" href={item.href} className="font-bold transition hover:text-primary">
                    {item.title}
                  </Link>
                ) : (
                  item.title
                ),
                item.detail,
                <StatusBadge key="priority" status={item.priority} />,
                item.source === "calendar" ? (
                  <CalendarEventStatusForm key="status" eventId={item.id} status={item.status} />
                ) : (
                  <StatusBadge key="status" status={item.status} />
                )
              ])}
              empty="No hay eventos proximos."
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Eventos manuales</CardDescription>
            <CardTitle>Calendario operativo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.calendarEvents.map((event) => (
              <article key={event.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-sm text-white">{event.title}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatDate(event.date)} {event.startTime ? `- ${event.startTime}` : ""}</span>
                  </div>
                  <Badge>{event.type}</Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {[event.clientName, event.projectName].filter(Boolean).join(" - ") || event.description || "Evento general"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={event.priority} />
                  <StatusBadge status={event.status} />
                </div>
              </article>
            ))}
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
        <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
