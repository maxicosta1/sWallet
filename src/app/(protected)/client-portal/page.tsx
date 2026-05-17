import Link from "next/link";
import type * as React from "react";
import { getClientPortalData } from "@/server/queries/client-portal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ClientPortalItemForm } from "@/components/forms/client-portal-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage() {
  const data = await getClientPortalData();
  const totalProjects = data.clients.reduce((sum, client) => sum + client.projects.length, 0);
  const totalPendingInvoices = data.clients.reduce((sum, client) => sum + client.totals.pendingInvoices, 0);
  const visibleItems = data.clients.reduce((sum, client) => sum + client.portalItems.filter((item) => item.status === "visible").length, 0);

  if (data.isClient && !data.clients.length) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Portal cliente</CardDescription>
            <CardTitle>Acceso sin cliente asociado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            No encontramos una ficha de cliente asociada al email de esta sesion. Pedile al equipo de sCode que revise el acceso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Proyectos visibles" value={totalProjects} />
        <Metric label="Facturas pendientes" value={totalPendingInvoices} />
        <Metric label="Items publicados" value={visibleItems} />
      </section>

      {!data.isClient ? (
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Administracion del portal</CardDescription>
              <CardTitle>Publicar item visible</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ClientPortalItemForm clients={data.clientOptions} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5">
        {data.clients.map((client) => (
          <section key={client.id} className="grid gap-5">
            <Card>
              <CardHeader>
                <div>
                  <CardDescription>Portal cliente</CardDescription>
                  <CardTitle className="text-2xl">{client.company}</CardTitle>
                </div>
                <StatusBadge status={client.status} />
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Info label="Contacto" value={client.name} />
                  <Info label="Servicio" value={client.service} />
                  <Info label="Proyectos activos" value={String(client.totals.projectsActive)} />
                  <Info label="Pendiente ARS" value={<CurrencyAmount value={client.totals.pendingAmountARS} currency="ARS" />} />
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardDescription>Estado de proyectos</CardDescription>
                    <CardTitle>Avance visible</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {client.projects.map((project) => (
                      <article key={project.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <strong className="block text-sm text-white">{project.name}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">{project.stage.replaceAll("_", " ")}</span>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                        <Progress value={project.progress} />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{project.progress}% completado</span>
                          <span>{project.dueAt ? formatDate(project.dueAt) : "Sin fecha de entrega"}</span>
                        </div>
                        {project.description ? <p className="text-xs leading-5 text-muted-foreground">{project.description}</p> : null}
                      </article>
                    ))}
                    {!client.projects.length ? <Empty text="Todavia no hay proyectos visibles." /> : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardDescription>Acciones y aprobaciones</CardDescription>
                    <CardTitle>Requiere atencion</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    headers={["Item", "Tipo", "Estado", "Link"]}
                    rows={[
                      ...client.portalItems.map((item) => [
                        item.title,
                        item.type,
                        <StatusBadge key="status" status={item.status} />,
                        item.link ? <Link key="link" href={item.link} className="font-bold text-primary">Abrir</Link> : "Sin link"
                      ]),
                      ...client.projects.flatMap((project) => project.tasksForReview.map((task) => [
                        task.title,
                        "tarea",
                        <StatusBadge key="status" status={task.status} />,
                        project.name
                      ]))
                    ]}
                    empty="No hay aprobaciones pendientes."
                  />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <div>
                    <CardDescription>Documentos compartidos</CardDescription>
                    <CardTitle>Archivos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    headers={["Nombre", "Tipo", "Link"]}
                    rows={[
                      ...client.documents.map((document) => [
                        document.name,
                        document.type,
                        document.link && document.link !== "#" ? <Link key="doc" href={document.link} className="text-primary">Abrir</Link> : "Sin link"
                      ]),
                      ...client.projects.flatMap((project) => project.sharedDocuments.map((document) => [
                        document.name,
                        document.type,
                        document.link && document.link !== "#" ? <Link key="doc" href={document.link} className="text-primary">Abrir</Link> : project.name
                      ]))
                    ]}
                    empty="No hay documentos compartidos."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardDescription>Facturas</CardDescription>
                    <CardTitle>Pagos pendientes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    headers={["Factura", "Saldo", "Vence", "Estado"]}
                    rows={client.invoices.map((invoice) => [
                      invoice.number,
                      <CurrencyAmount key="balance" value={invoice.balanceDue} currency={invoice.currency} />,
                      formatDate(invoice.dueDate),
                      <StatusBadge key="status" status={invoice.status} />
                    ])}
                    empty="No hay facturas visibles."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardDescription>Servicios activos</CardDescription>
                    <CardTitle>Mantenimiento</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {client.supportPlans.map((plan) => (
                      <article key={plan.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <strong className="text-sm text-white">{plan.plan}</strong>
                          <Badge>{plan.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.domain} - {plan.hosting}</p>
                        <p className="text-xs text-muted-foreground">
                          Dominio: {plan.domainRenewal ? formatDate(plan.domainRenewal) : "sin fecha"} - Hosting: {plan.hostingRenewal ? formatDate(plan.hostingRenewal) : "sin fecha"}
                        </p>
                      </article>
                    ))}
                    {!client.supportPlans.length ? <Empty text="Sin mantenimiento publicado." /> : null}
                  </div>
                </CardContent>
              </Card>
            </section>
          </section>
        ))}
      </div>
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

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-muted-foreground">{text}</div>;
}
