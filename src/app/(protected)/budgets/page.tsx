import Link from "next/link";
import type * as React from "react";
import { getBudgetsData } from "@/server/queries/budgets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { BudgetForm } from "@/components/forms/entity-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const data = await getBudgetsData();
  const pending = data.budgets.filter((budget) => budget.status === "borrador" || budget.status === "enviado").length;
  const approved = data.budgets.filter((budget) => budget.status === "aprobado").length;
  const totalARS = data.budgets.filter((budget) => budget.currency === "ARS").reduce((sum, budget) => sum + budget.total, 0);
  const totalUSD = data.budgets.filter((budget) => budget.currency === "USD").reduce((sum, budget) => sum + budget.total, 0);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Presupuestos" value={data.budgets.length} />
        <Metric label="Pendientes" value={pending} />
        <Metric label="Aprobados" value={approved} />
        <Metric label="Pipeline" value={<><CurrencyAmount value={totalARS} currency="ARS" /> / <CurrencyAmount value={totalUSD} currency="USD" /></>} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Ventas</CardDescription>
              <CardTitle>Nuevo presupuesto</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <BudgetForm clients={data.clients} projects={data.projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Propuestas comerciales</CardDescription>
              <CardTitle>Presupuestos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Numero", "Cliente", "Titulo", "Total", "Validez", "Estado", "Conversion"]}
              rows={data.budgets.map((budget) => [
                <Link key="budget" href={`/budgets/${budget.id}`} className="font-bold transition hover:text-primary">
                  {budget.number}
                </Link>,
                budget.clientName,
                budget.title,
                <CurrencyAmount key="total" value={budget.total} currency={budget.currency} />,
                budget.validUntil ? formatDate(budget.validUntil) : "Sin fecha",
                <StatusBadge key="status" status={budget.status} />,
                conversionLabel(budget)
              ])}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function conversionLabel(budget: { invoiceCount: number; approvedProject: { id: string; name: string } | null }) {
  if (budget.invoiceCount && budget.approvedProject) return "Proyecto + factura";
  if (budget.invoiceCount) return "Factura";
  if (budget.approvedProject) return "Proyecto";
  return "Pendiente";
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
