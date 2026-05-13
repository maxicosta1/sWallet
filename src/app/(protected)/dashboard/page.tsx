import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  DollarSign,
  MinusCircle,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
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
  const reportItems = [
    { label: "Ingresos", value: data.metrics.monthIncome, color: "bg-primary/75", tint: "bg-primary/10" },
    { label: "Gastos", value: data.metrics.monthExpenses, color: "bg-coral/80", tint: "bg-coral/10" },
    { label: "Neto", value: Math.max(data.metrics.netProfit, 0), color: "bg-emerald-300/80", tint: "bg-emerald-300/10" },
    { label: "ARS", value: Math.max(data.metrics.balanceARS, 0), color: "bg-sky-300/80", tint: "bg-sky-300/10" },
    { label: "USD", value: Math.max(data.metrics.balanceUSD * data.exchangeRate, 0), color: "bg-white/90", tint: "bg-white/10" }
  ];
  const reportMax = Math.max(...reportItems.map((item) => item.value), 1);

  return (
    <>
      <div className="grid gap-4 lg:hidden">
        <BankBalanceCard
          balance={data.metrics.totalBalanceARS}
          ars={data.metrics.balanceARS}
          usd={data.metrics.balanceUSD}
          exchangeRate={data.exchangeRate}
        />

        <section className="rounded-[1.65rem] border border-white/10 bg-[#101116]/90 px-5 py-4 shadow-glass">
          <MobileSummaryRow label="Ingresos recientes" value={formatCurrency(data.metrics.monthIncome, "ARS")} />
          <MobileSummaryRow label="Gastos recientes" value={formatCurrency(data.metrics.monthExpenses, "ARS")} muted />
        </section>

        <section className="grid grid-cols-3 gap-3">
          <MobileAction href="/movements" label="Agregar" title="Gasto" icon={MinusCircle} tone="coral" />
          <MobileAction href="/movements" label="Agregar" title="Ingreso" icon={PlusCircle} tone="green" />
          <MobileAction href="/movements" label="Ver" title="Movimientos" icon={CheckCircle2} tone="purple" />
        </section>

        <section className="rounded-[1.65rem] border border-white/10 bg-[#101116]/90 p-5 shadow-glass">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-primary">Resumen</p>
              <h2 className="mt-1 text-xl font-black text-white">Informe financiero</h2>
            </div>
            <Link href="/reports" className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white ring-1 ring-white/10">
              <ArrowUpRight className="h-4 w-4" />
              <span className="sr-only">Ver reportes</span>
            </Link>
          </div>
          <div className="grid h-40 grid-cols-5 items-end gap-3">
            {reportItems.map((item) => {
              const height = Math.max(8, Math.round((item.value / reportMax) * 100));
              return (
                <div key={item.label} className="flex h-full min-w-0 flex-col justify-end gap-2">
                  <span className="text-center text-xs font-black text-white/65">{height}%</span>
                  <div className={`relative h-full overflow-hidden rounded-2xl ${item.tint}`}>
                    <div className={`absolute inset-x-0 bottom-0 rounded-t-2xl ${item.color}`} style={{ height: `${height}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
            {reportItems.map((item) => (
              <div key={item.label} className="flex min-w-0 items-center gap-2">
                <span className={`h-3 w-3 shrink-0 rounded ${item.color}`} />
                <span className="truncate text-xs font-bold text-white/70">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.65rem] border border-white/10 bg-[#101116]/90 p-5 shadow-glass">
          <div className="mb-4">
            <p className="text-xs font-black uppercase text-primary">Actividad</p>
            <h2 className="mt-1 text-xl font-black text-white">Ultimos movimientos</h2>
          </div>
          <div className="grid gap-3">
            {data.recentActivity.slice(0, 3).map((item) => (
              <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <CurrencyAmount value={item.amount} currency={item.currency} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="hidden gap-5 lg:grid">
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
    </>
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

function MobileSummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-b-0">
      <span className="min-w-0 truncate text-sm font-bold text-white/70">{label}</span>
      <strong className={muted ? "shrink-0 text-sm font-black text-white/65" : "shrink-0 text-sm font-black text-white"}>
        {value}
      </strong>
    </div>
  );
}

function MobileAction({
  href,
  label,
  title,
  icon: Icon,
  tone
}: {
  href: string;
  label: string;
  title: string;
  icon: typeof MinusCircle;
  tone: "coral" | "green" | "purple";
}) {
  const toneClass = {
    coral: "text-coral",
    green: "text-emerald-200",
    purple: "text-primary"
  };

  return (
    <Link href={href} className="min-h-36 rounded-[1.45rem] border border-white/10 bg-[#101116] p-4 shadow-glass transition active:scale-[0.98]">
      <div className="flex h-full min-w-0 flex-col justify-between">
        <Icon className={`ml-auto h-7 w-7 ${toneClass[tone]}`} />
        <div className="min-w-0">
          <span className="text-xs font-bold text-white/50">{label}</span>
          <strong className="mt-1 block break-words text-xl font-black leading-tight text-white">{title}</strong>
        </div>
      </div>
    </Link>
  );
}
