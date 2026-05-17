import Link from "next/link";
import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/forms/entity-forms";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const data = await getDashboardData();

  return (
    <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>CRM interno</CardDescription>
            <CardTitle>Crear cliente</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Portfolio</CardDescription>
            <CardTitle>Clientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Cliente", "Servicio", "Genero", "Debe", "Proyectos", "Estado"]}
            rows={data.clients.map((client) => [
              <Link key="client" href={`/clients/${client.id}`} className="block transition hover:text-primary">
                <strong className="block">{client.company}</strong>
                <span className="text-xs text-muted-foreground">{client.name} - {client.email}</span>
              </Link>,
              client.service,
              <CurrencyAmount key="generated" value={client.generated} currency="ARS" />,
              <CurrencyAmount key="debt" value={client.debt} currency="ARS" />,
              client.projectCount,
              <StatusBadge key="status" status={client.status} />
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
