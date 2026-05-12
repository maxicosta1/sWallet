import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/forms/entity-forms";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const data = await getDashboardData();
  const clients = data.clients.map((client) => ({ id: client.id, label: `${client.company} · ${client.name}` }));

  return (
    <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Cobranza</CardDescription>
            <CardTitle>Registrar pago</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <PaymentForm clients={clients} />
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
