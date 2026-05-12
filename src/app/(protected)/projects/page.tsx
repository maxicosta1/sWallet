import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/forms/entity-forms";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const data = await getDashboardData();
  const clients = data.clients.map((client) => ({ id: client.id, label: `${client.company} · ${client.name}` }));

  return (
    <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Operaciones</CardDescription>
            <CardTitle>Crear proyecto</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectForm clients={clients} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Delivery</CardDescription>
            <CardTitle>Proyectos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Proyecto", "Cliente", "Presupuesto", "Progreso", "Entrega", "Estado"]}
            rows={data.projects.map((project) => [
              project.name,
              project.clientName,
              <CurrencyAmount key="budget" value={project.budget} currency={project.currency} />,
              <div key="progress" className="min-w-32"><Progress value={project.progress} /><span className="mt-1 block text-xs text-muted-foreground">{project.progress}%</span></div>,
              project.dueAt ? formatDate(project.dueAt) : "Sin fecha",
              <StatusBadge key="status" status={project.status} />
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
