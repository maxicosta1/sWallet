import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, FolderKanban } from "lucide-react";
import { getBudgetDetail } from "@/server/queries/budgets";
import { convertBudgetToInvoiceAction, convertBudgetToProjectAction } from "@/server/actions/finance-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/billing/print-button";

export const dynamic = "force-dynamic";

type BudgetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BudgetPage({ params }: BudgetPageProps) {
  const { id } = await params;
  const budget = await getBudgetDetail(id);
  if (!budget) notFound();

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost">
          <Link href="/budgets">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <PrintButton />
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="rounded-[1.65rem] border border-white/10 bg-white p-8 text-slate-950 shadow-2xl print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-2xl font-black text-white">s</div>
              <h1 className="mt-5 text-2xl font-black">sCode Digital Solutions</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Propuesta comercial para servicios digitales, desarrollo web, automatizaciones y soporte operativo.
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                contact@scodedigital.com - scodedigital.com
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Presupuesto</p>
              <p className="mt-2 text-3xl font-black">{budget.number}</p>
              <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                {budget.status.replaceAll("_", " ")}
              </div>
            </div>
          </header>

          <section className="grid gap-6 border-b border-slate-200 py-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Cliente</p>
              <h2 className="mt-2 text-xl font-black">{budget.client?.company ?? "Cliente sin asociar"}</h2>
              {budget.client ? (
                <>
                  <p className="mt-1 text-sm text-slate-600">{budget.client.name}</p>
                  <p className="text-sm text-slate-600">{budget.client.email}</p>
                  <p className="text-sm text-slate-600">{budget.client.phone}</p>
                </>
              ) : null}
            </div>
            <dl className="grid gap-3 text-sm">
              <Detail label="Titulo" value={budget.title} />
              <Detail label="Emision" value={formatDate(budget.issueDate)} />
              <Detail label="Validez" value={budget.validUntil ? formatDate(budget.validUntil) : "Sin vencimiento"} />
              <Detail label="Proyecto" value={budget.project?.name ?? "Sin proyecto asociado"} />
            </dl>
          </section>

          {budget.services ? (
            <section className="border-b border-slate-200 py-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Servicios incluidos</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{budget.services}</p>
            </section>
          ) : null}

          <section className="py-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-3">Concepto</th>
                  <th className="py-3 text-right">Cantidad</th>
                  <th className="py-3 text-right">Unitario</th>
                  <th className="py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {budget.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-4 font-semibold">{item.description}</td>
                    <td className="py-4 text-right">{item.quantity}</td>
                    <td className="py-4 text-right">{formatCurrency(item.unitPrice, budget.currency)}</td>
                    <td className="py-4 text-right font-bold">{formatCurrency(item.total, budget.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-6 border-t border-slate-200 pt-8 md:grid-cols-[1fr_300px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Condiciones</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {budget.notes || "La validez de esta propuesta esta sujeta a disponibilidad operativa y aprobacion comercial."}
              </p>
            </div>
            <dl className="grid gap-3 text-sm">
              <Detail label="Subtotal" value={formatCurrency(budget.subtotal, budget.currency)} />
              <Detail label="Descuento" value={formatCurrency(budget.discount, budget.currency)} />
              <Detail label="Impuestos" value={formatCurrency(budget.taxes, budget.currency)} />
              <Detail label="Total" value={formatCurrency(budget.total, budget.currency)} strong />
            </dl>
          </section>

          <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">
            sCode Digital Solutions - Presupuesto generado desde sWallet.
          </footer>
        </article>

        <aside className="grid content-start gap-5 print:hidden">
          <Card>
            <CardHeader>
              <div>
                <CardDescription>Conversion</CardDescription>
                <CardTitle>Acciones comerciales</CardTitle>
              </div>
              <StatusBadge status={budget.status} />
            </CardHeader>
            <CardContent className="grid gap-3">
              <form action={convertBudgetToProjectAction}>
                <input type="hidden" name="budgetId" value={budget.id} />
                <Button className="w-full" disabled={!budget.client || Boolean(budget.approvedProject || budget.project)}>
                  <FolderKanban className="h-4 w-4" />
                  Convertir en proyecto
                </Button>
              </form>
              <form action={convertBudgetToInvoiceAction}>
                <input type="hidden" name="budgetId" value={budget.id} />
                <Button className="w-full" variant="ghost" disabled={!budget.client}>
                  <FileText className="h-4 w-4" />
                  Convertir en factura
                </Button>
              </form>
              {!budget.client ? <p className="text-xs text-muted-foreground">Asocia un cliente para habilitar conversiones.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardDescription>Relaciones</CardDescription>
                <CardTitle>Resultado</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={["Tipo", "Detalle"]}
                rows={[
                  budget.approvedProject ? ["Proyecto", budget.approvedProject.name] : ["Proyecto", "Sin convertir"],
                  ...budget.invoices.map((invoice) => ["Factura", <Link key={invoice.id} href={`/billing/${invoice.id}`} className="text-primary">{invoice.number}</Link>])
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardDescription>Total</CardDescription>
                <CardTitle><CurrencyAmount value={budget.total} currency={budget.currency} /></CardTitle>
              </div>
            </CardHeader>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? "text-right text-base font-black text-slate-950" : "text-right font-semibold text-slate-800"}>{value}</dd>
    </div>
  );
}
