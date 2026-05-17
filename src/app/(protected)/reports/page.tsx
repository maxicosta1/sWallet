import Link from "next/link";
import type * as React from "react";
import { getAdvancedReportsData } from "@/server/queries/reports-advanced";
import { BalanceAreaChart, CashflowChart, GrowthLineChart, ServicePieChart } from "@/components/charts/finance-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ExportButtons } from "@/components/reports/export-buttons";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const data = await getAdvancedReportsData(query);
  const exportRows = data.cashMovements.map((movement) => ({
    tipo: movement.type,
    categoria: movement.category,
    descripcion: movement.description,
    cliente: movement.clientName,
    proyecto: movement.projectName,
    monto: movement.amount,
    moneda: movement.currency,
    montoARS: movement.amountARS,
    fecha: movement.date.toISOString()
  }));

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Analytics</CardDescription>
            <CardTitle>Reportes y busqueda global</CardTitle>
          </div>
          <ExportButtons rows={exportRows} filename="scode-cash-report" />
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 md:flex-row" action="/reports">
            <Input name="q" defaultValue={query} placeholder="Buscar clientes, proyectos, facturas, presupuestos, pagos, tareas, documentos o equipo" />
            <Button className="md:w-40">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Ingresos caja" value={<CurrencyAmount value={data.metrics.cashIncomeARS} currency="ARS" />} />
        <Metric label="Egresos caja" value={<CurrencyAmount value={data.metrics.cashExpensesARS} currency="ARS" />} />
        <Metric label="Ganancia neta" value={<CurrencyAmount value={data.metrics.cashIncomeARS - data.metrics.cashExpensesARS} currency="ARS" />} />
        <Metric label="Deuda total" value={<CurrencyAmount value={data.metrics.debtARS} currency="ARS" />} />
        <Metric label="Facturas vencidas" value={data.metrics.overdueInvoices} />
        <Metric label="Pipeline ponderado" value={<CurrencyAmount value={data.metrics.openPipelineARS} currency="ARS" />} />
      </section>

      {query ? (
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Resultados</CardDescription>
              <CardTitle>Busqueda global</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Tipo", "Titulo", "Detalle", "Estado"]}
              rows={data.search.map((result) => [
                result.type,
                <Link key="title" href={result.href} className="font-bold text-primary">{result.title}</Link>,
                result.detail,
                <StatusBadge key="status" status={result.status} />
              ])}
              empty="No encontramos resultados para esa busqueda."
            />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <CashflowChart data={data.charts.monthly} />
        <BalanceAreaChart data={data.charts.monthly} />
        <GrowthLineChart data={data.charts.monthly} />
        <ServicePieChart data={data.charts.services} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Clientes</CardDescription>
              <CardTitle>Rentabilidad y deuda</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Cliente", "Cobrado", "Deuda", "Valor", "Proyectos"]}
              rows={data.clientProfitability.slice(0, 10).map((client) => [
                <Link key="client" href={`/clients/${client.id}`} className="font-bold text-primary">{client.name}</Link>,
                <CurrencyAmount key="paid" value={client.paidARS} currency="ARS" />,
                <CurrencyAmount key="debt" value={client.debtARS} currency="ARS" />,
                <CurrencyAmount key="value" value={client.valueARS} currency="ARS" />,
                client.projects
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Proyectos</CardDescription>
              <CardTitle>Rentabilidad real</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Proyecto", "Cliente", "Cobrado", "Gastos", "Ganancia", "Hora real"]}
              rows={data.projectProfitability.slice(0, 10).map((project) => [
                <Link key="project" href={`/projects/${project.id}`} className="font-bold text-primary">{project.name}</Link>,
                project.clientName,
                <CurrencyAmount key="collected" value={project.collectedARS} currency="ARS" />,
                <CurrencyAmount key="expenses" value={project.expensesARS} currency="ARS" />,
                <CurrencyAmount key="profit" value={project.profitARS} currency="ARS" />,
                <CurrencyAmount key="hour" value={project.realHourlyValue} currency="ARS" />
              ])}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <SavedFilter title="Clientes con deuda" count={data.filters.debtClients.length}>
          <DataTable
            headers={["Cliente", "Deuda"]}
            rows={data.filters.debtClients.slice(0, 6).map((client) => [
              <Link key="client" href={`/clients/${client.id}`} className="font-bold text-primary">{client.name}</Link>,
              <CurrencyAmount key="debt" value={client.debtARS} currency="ARS" />
            ])}
          />
        </SavedFilter>
        <SavedFilter title="Facturas vencidas" count={data.filters.overdueInvoices.length}>
          <DataTable
            headers={["Factura", "Cliente", "Saldo"]}
            rows={data.filters.overdueInvoices.slice(0, 6).map((invoice) => [
              <Link key="invoice" href={`/billing/${invoice.id}`} className="font-bold text-primary">{invoice.number}</Link>,
              invoice.clientName,
              <CurrencyAmount key="balance" value={invoice.balanceDue} currency={invoice.currency} />
            ])}
          />
        </SavedFilter>
        <SavedFilter title="Tareas urgentes" count={data.filters.urgentTasks.length}>
          <DataTable
            headers={["Tarea", "Proyecto", "Vence"]}
            rows={data.filters.urgentTasks.slice(0, 6).map((task) => [
              task.title,
              task.projectName ?? task.clientName ?? "Interna",
              task.dueDate ? formatDate(task.dueDate) : "Sin fecha"
            ])}
          />
        </SavedFilter>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Equipo</CardDescription>
              <CardTitle>Horas y rendimiento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Persona", "Rol", "Horas", "Completadas", "Pendientes"]}
              rows={data.teamPerformance.slice(0, 10).map((member) => [
                member.name,
                member.role,
                `${member.hours.toFixed(1)} h`,
                `${member.completed} (${member.completionRate}%)`,
                member.pending
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Marketing</CardDescription>
              <CardTitle>Conversion de campanas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Campana", "Respuesta", "Reunion", "Cierre", "Pipeline"]}
              rows={data.campaignReports.slice(0, 10).map((campaign) => [
                campaign.name,
                `${campaign.responseRate}%`,
                `${campaign.meetingRate}%`,
                `${campaign.closingRate}%`,
                <CurrencyAmount key="pipeline" value={campaign.pipelineARS} currency="ARS" />
              ])}
            />
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

function SavedFilter({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardDescription>Filtro guardado</CardDescription>
          <CardTitle>{title}</CardTitle>
        </div>
        <StatusBadge status={count ? "alta" : "normal"} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
