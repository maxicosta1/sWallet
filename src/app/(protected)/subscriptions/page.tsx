import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionForm } from "@/components/forms/entity-forms";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const data = await getDashboardData();

  return (
    <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Servicios</CardDescription>
            <CardTitle>Nueva suscripción</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SubscriptionForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Renovaciones</CardDescription>
            <CardTitle>Suscripciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Servicio", "Proveedor", "Mensual", "Anual", "Renueva", "Estado"]}
            rows={data.subscriptions.map((subscription) => [
              subscription.name,
              subscription.provider,
              <CurrencyAmount key="monthly" value={subscription.monthlyCost} currency={subscription.currency} />,
              <CurrencyAmount key="annual" value={subscription.annualCost} currency={subscription.currency} />,
              formatDate(subscription.renewsAt),
              <StatusBadge key="status" status={subscription.status} />
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
