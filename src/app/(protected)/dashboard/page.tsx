import { Banknote, CreditCard, DollarSign, TrendingDown, TrendingUp, Users, Wallet, AlertTriangle } from "lucide-react";
import { getDashboardData } from "@/server/queries/dashboard";
import { BankBalanceCard } from "@/components/dashboard/bank-balance-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CashflowChart, BalanceAreaChart } from "@/components/charts/finance-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <BankBalanceCard
          balance={data.metrics.totalBalanceARS}
          ars={data.metrics.balanceARS}
          usd={data.metrics.balanceUSD}
          exchangeRate={data.exchangeRate}
        />
        <Card className="min-h-[330px]">
          <CardHeader>
            <div>
              <CardDescription>Quick insights</CardDescription>
              <CardTitle>Resumen operativo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Insight label="Ganancia neta" value={formatCurrency(data.metrics.netProfit, "ARS")} />
            <Insight label="Estimado mensual" value={formatCurrency(data.metrics.estimatedMonth, "ARS")} />
            <Insight label="Clientes activos" value={String(data.metrics.activeClients)} />
            <Insight label="Pagos vencidos" value={String(data.metrics.duePayments)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingresos del mes" value={formatCurrency(data.metrics.monthIncome, "ARS")} hint="Cobros + ingresos" icon={TrendingUp} tone="green" />
        <MetricCard label="Gastos del mes" value={formatCurrency(data.metrics.monthExpenses, "ARS")} hint="Gastos + inversiones" icon={TrendingDown} tone="coral" />
        <MetricCard label="Clientes con deuda" value={String(data.metrics.debtClients)} hint="Cuentas a seguir" icon={Users} tone="purple" />
        <MetricCard label="Caja USD" value={formatCurrency(data.metrics.balanceUSD, "USD")} hint="Balance separado" icon={DollarSign} tone="blue" />
        <MetricCard label="Saldo total" value={formatCurrency(data.metrics.totalBalanceARS, "ARS")} hint="Consolidado" icon={Wallet} tone="purple" />
        <MetricCard label="Caja ARS" value={formatCurrency(data.metrics.balanceARS, "ARS")} hint="Balance local" icon={Banknote} tone="green" />
        <MetricCard label="Pagos próximos" value={String(data.alerts.upcomingPayments.length)} hint="Próximos 10 días" icon={AlertTriangle} tone="coral" />
        <MetricCard label="Suscripciones" value={String(data.subscriptions.length)} hint="Servicios activos" icon={CreditCard} tone="blue" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <CashflowChart data={data.charts.monthly} />
        <BalanceAreaChart data={data.charts.monthly} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Alertas</CardDescription>
              <CardTitle>Pagos próximos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Cliente", "Monto", "Vence", "Estado"]}
              rows={data.alerts.upcomingPayments.map((payment) => [
                payment.clientName,
                <CurrencyAmount key="amount" value={payment.amount - payment.paidAmount} currency={payment.currency} />,
                formatDate(payment.dueDate),
                <StatusBadge key="status" status={payment.status} />
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Historial</CardDescription>
              <CardTitle>Movimientos recientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Tipo", "Detalle", "Monto", "Fecha"]}
              rows={data.recentActivity.map((item) => [
                item.kind,
                item.title,
                <CurrencyAmount key="amount" value={item.amount} currency={item.currency} />,
                formatDate(item.date)
              ])}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <strong className="mt-2 block break-words text-xl font-black text-white">{value}</strong>
    </div>
  );
}
