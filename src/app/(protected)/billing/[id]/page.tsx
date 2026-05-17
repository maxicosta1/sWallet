import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getInvoiceDetail } from "@/server/queries/billing";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { InvoicePaymentForm } from "@/components/forms/entity-forms";
import { PrintButton } from "@/components/billing/print-button";

export const dynamic = "force-dynamic";

type InvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const data = await getInvoiceDetail(id);
  if (!data) notFound();

  const { invoice, categories } = data;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost">
          <Link href="/billing">
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
                Desarrollo web, automatizaciones y soluciones digitales para equipos que necesitan vender, operar y medir mejor.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Factura</p>
              <p className="mt-2 text-3xl font-black">{invoice.number}</p>
              <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                {invoice.status.replaceAll("_", " ")}
              </div>
            </div>
          </header>

          <section className="grid gap-6 border-b border-slate-200 py-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Cliente</p>
              <h2 className="mt-2 text-xl font-black">{invoice.client.company}</h2>
              <p className="mt-1 text-sm text-slate-600">{invoice.client.name}</p>
              <p className="text-sm text-slate-600">{invoice.client.email}</p>
              <p className="text-sm text-slate-600">{invoice.client.phone}</p>
            </div>
            <dl className="grid gap-3 text-sm">
              <Detail label="Emision" value={formatDate(invoice.issueDate)} />
              <Detail label="Vencimiento" value={formatDate(invoice.dueDate)} />
              <Detail label="Proyecto" value={invoice.project?.name ?? "Sin proyecto asociado"} />
              <Detail label="Moneda" value={invoice.currency} />
            </dl>
          </section>

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
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-4 font-semibold">{item.description}</td>
                    <td className="py-4 text-right">{item.quantity}</td>
                    <td className="py-4 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="py-4 text-right font-bold">{formatCurrency(item.total, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-6 border-t border-slate-200 pt-8 md:grid-cols-[1fr_300px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Notas</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {invoice.notes || "Gracias por confiar en sCode. Los pagos confirmados se imputan al saldo de esta factura."}
              </p>
            </div>
            <dl className="grid gap-3 text-sm">
              <Detail label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
              <Detail label="Descuento" value={formatCurrency(invoice.discount, invoice.currency)} />
              <Detail label="Impuestos" value={formatCurrency(invoice.taxes, invoice.currency)} />
              <Detail label="Total" value={formatCurrency(invoice.total, invoice.currency)} strong />
              <Detail label="Pagado" value={formatCurrency(invoice.paid, invoice.currency)} />
              <Detail label="Saldo pendiente" value={formatCurrency(invoice.balanceDue, invoice.currency)} strong />
            </dl>
          </section>

          <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">
            sCode Digital Solutions - Documento generado desde sWallet.
          </footer>
        </article>

        <aside className="grid content-start gap-5 print:hidden">
          <Card>
            <CardHeader>
              <div>
                <CardDescription>Cobranza</CardDescription>
                <CardTitle>Registrar pago</CardTitle>
              </div>
              <StatusBadge status={invoice.status} />
            </CardHeader>
            <CardContent>
              {invoice.balanceDue > 0 ? (
                <InvoicePaymentForm
                  invoice={{
                    id: invoice.id,
                    balanceDue: invoice.balanceDue,
                    currency: invoice.currency,
                    dueDate: invoice.dueDate
                  }}
                  categories={categories}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Esta factura no tiene saldo pendiente.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardDescription>Historial</CardDescription>
                <CardTitle>Pagos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={["Monto", "Fecha", "Estado"]}
                rows={invoice.payments.map((payment) => [
                  <CurrencyAmount key="amount" value={payment.paidAmount} currency={payment.currency} />,
                  formatDate(payment.date),
                  <StatusBadge key="status" status={payment.status} />
                ])}
              />
            </CardContent>
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
