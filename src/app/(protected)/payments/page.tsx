import { getDashboardData } from "@/server/queries/dashboard";
import { getBillingData } from "@/server/queries/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/forms/entity-forms";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [data, billing] = await Promise.all([getDashboardData(), getBillingData()]);
  const clients = data.clients.map((client) => ({ id: client.id, label: `${client.company} - ${client.name}` }));
  const invoices = billing.invoices
    .filter((invoice) => invoice.balanceDue > 0)
    .map((invoice) => ({ id: invoice.id, label: `${invoice.number} - ${invoice.clientName}` }));

  return (
    <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Cobranza</CardDescription>
            <CardTitle>Registrar pago</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <PaymentForm clients={clients} projects={billing.projects} invoices={invoices} categories={billing.categories} />
          <p className="text-xs leading-5 text-muted-foreground">
            Cuando el estado es pagado, sWallet crea un movimiento de ingreso y actualiza el saldo de la factura asociada.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Pipeline</CardDescription>
            <CardTitle>Pagos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Cliente", "Monto", "Pagado", "Fecha", "Vence", "Estado"]}
            rows={data.payments.map((payment) => [
              payment.clientName,
              <CurrencyAmount key="amount" value={payment.amount} currency={payment.currency} />,
              <CurrencyAmount key="paid" value={payment.paidAmount} currency={payment.currency} />,
              formatDate(payment.date),
              formatDate(payment.dueDate),
              <StatusBadge key="status" status={payment.status} />
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
