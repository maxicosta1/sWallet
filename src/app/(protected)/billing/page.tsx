import Link from "next/link";
import type * as React from "react";
import { getBillingData } from "@/server/queries/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InvoiceForm } from "@/components/forms/entity-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const data = await getBillingData();
  const pendingARS = data.invoices.filter((invoice) => invoice.currency === "ARS").reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const pendingUSD = data.invoices.filter((invoice) => invoice.currency === "USD").reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const overdue = data.invoices.filter((invoice) => invoice.status === "vencida").length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Facturas" value={data.invoices.length} />
        <Metric label="Pendiente ARS" value={<CurrencyAmount value={pendingARS} currency="ARS" />} />
        <Metric label="Pendiente USD" value={<CurrencyAmount value={pendingUSD} currency="USD" />} />
        <Metric label="Vencidas" value={overdue} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Facturacion</CardDescription>
              <CardTitle>Nueva factura</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <InvoiceForm clients={data.clients} projects={data.projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Documentos de cobro</CardDescription>
              <CardTitle>Facturas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Factura", "Cliente", "Proyecto", "Total", "Saldo", "Vence", "Estado"]}
              rows={data.invoices.map((invoice) => [
                <Link key="invoice" href={`/billing/${invoice.id}`} className="font-bold transition hover:text-primary">
                  {invoice.number}
                </Link>,
                invoice.clientName,
                invoice.projectName ?? "Sin proyecto",
                <CurrencyAmount key="total" value={invoice.total} currency={invoice.currency} />,
                <CurrencyAmount key="balance" value={invoice.balanceDue} currency={invoice.currency} />,
                formatDate(invoice.dueDate),
                <StatusBadge key="status" status={invoice.status} />
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
