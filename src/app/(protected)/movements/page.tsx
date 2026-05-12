import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementForm } from "@/components/forms/entity-forms";
import { DataTable } from "@/components/dashboard/data-table";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MovementsPage() {
  const [data, categories] = await Promise.all([
    getDashboardData(),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Caja</CardDescription>
            <CardTitle>Registrar movimiento</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MovementForm categories={categories.map((category) => ({ id: category.id, label: category.name }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Historial</CardDescription>
            <CardTitle>Movimientos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Tipo", "Categoría", "Monto", "Fecha", "Descripción"]}
            rows={data.movements.map((movement) => [
              <StatusBadge key="type" status={movement.type} />,
              movement.category,
              <CurrencyAmount key="amount" value={movement.amount} currency={movement.currency} />,
              formatDate(movement.date),
              movement.description
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
