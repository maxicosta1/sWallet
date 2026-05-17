import { getOperationsData } from "@/server/queries/operations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TeamMemberForm, TimeEntryForm } from "@/components/forms/operations-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const data = await getOperationsData();
  const teamMembers = data.teamMembers.map((member) => ({ id: member.id, label: member.fullName || member.email }));
  const tasks = data.tasks.map((task) => ({ id: task.id, label: task.title }));
  const totalHours = data.teamMembers.reduce((sum, member) => sum + member.hours, 0);
  const activePeople = data.teamMembers.filter((member) => member.status === "activo").length;
  const pendingTasks = data.teamMembers.reduce((sum, member) => sum + member.pendingTasks, 0);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Personas activas" value={activePeople} />
        <Metric label="Tareas pendientes" value={pendingTasks} />
        <Metric label="Horas registradas" value={Number(totalHours.toFixed(1))} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Equipo</CardDescription>
              <CardTitle>Nueva persona</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TeamMemberForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Horas</CardDescription>
              <CardTitle>Registrar trabajo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TimeEntryForm teamMembers={teamMembers} projects={data.projects} tasks={tasks} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Gestion interna</CardDescription>
            <CardTitle>Equipo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Persona", "Rol", "Estado", "Proyectos", "Tareas", "Completadas", "Horas"]}
            rows={data.teamMembers.map((member) => [
              <div key="person">
                <strong className="block">{member.fullName || member.name}</strong>
                <span className="text-xs text-muted-foreground">{member.email}</span>
              </div>,
              member.role,
              <StatusBadge key="status" status={member.status} />,
              member.projectCount,
              member.pendingTasks,
              member.completedTasks,
              `${member.hours.toFixed(1)} h`
            ])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Actividad reciente</CardDescription>
            <CardTitle>Horas cargadas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Persona", "Proyecto", "Tarea", "Horas", "Fecha"]}
            rows={data.timeEntries.map((entry) => [
              entry.teamMemberName,
              entry.projectName,
              entry.taskTitle,
              `${entry.hours.toFixed(1)} h`,
              formatDate(entry.date)
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
        <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}
