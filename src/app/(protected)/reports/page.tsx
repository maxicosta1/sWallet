import { getDashboardData } from "@/server/queries/dashboard";
import { BalanceAreaChart, CashflowChart, GrowthLineChart, ServicePieChart } from "@/components/charts/finance-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { ExportButtons } from "@/components/reports/export-buttons";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getDashboardData();
  const exportRows = data.movements.map((movement) => ({
    tipo: movement.type,
    categoria: movement.category,
    descripcion: movement.description,
    monto: movement.amount,
    moneda: movement.currency,
    fecha: movement.date.toISOString()
  }));

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Analytics</CardDescription>
            <CardTitle>Reportes financieros</CardTitle>
          </div>
          <ExportButtons rows={exportRows} filename="scode-finance-report" />
        </CardHeader>
      </Card>
      <section className="grid gap-5 xl:grid-cols-2">
        <CashflowChart data={data.charts.monthly} />
        <BalanceAreaChart data={data.charts.monthly} />
        <GrowthLineChart data={data.charts.monthly} />
        <ServicePieChart data={data.charts.services} />
      </section>
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Rentabilidad</CardDescription>
            <CardTitle>Clientes más rentables</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Cliente", "Ingresos"]}
            rows={data.charts.profitableClients.map((client) => [
              client.name,
              <CurrencyAmount key="value" value={client.value} currency="ARS" />
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
