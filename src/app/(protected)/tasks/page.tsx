import Link from "next/link";
import { getOperationsData } from "@/server/queries/operations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TaskForm, TaskStatusForm } from "@/components/forms/operations-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const columns = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_proceso", label: "En proceso" },
  { key: "en_revision", label: "En revision" },
  { key: "bloqueada", label: "Bloqueada" },
  { key: "completada", label: "Completada" }
];

export default async function TasksPage() {
  const data = await getOperationsData();
  const overdue = data.tasks.filter((task) => task.dueDate && task.dueDate < new Date() && task.status !== "completada").length;
  const urgent = data.tasks.filter((task) => task.priority === "urgente").length;
  const active = data.tasks.filter((task) => task.status !== "completada" && task.status !== "cancelada").length;
  const teamMembers = data.teamMembers.map((member) => ({ id: member.id, label: member.fullName || member.email }));
  const tasks = data.tasks.map((task) => ({ id: task.id, label: task.title }));

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Activas" value={active} />
        <Metric label="Urgentes" value={urgent} />
        <Metric label="Vencidas" value={overdue} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Operacion</CardDescription>
              <CardTitle>Nueva tarea</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TaskForm clients={data.clients} projects={data.projects} teamMembers={teamMembers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Kanban operativo</CardDescription>
              <CardTitle>Tareas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 xl:grid-cols-5">
              {columns.map((column) => {
                const columnTasks = data.tasks.filter((task) => task.status === column.key);
                return (
                  <section key={column.key} className="grid content-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-white">{column.label}</h3>
                      <Badge>{columnTasks.length}</Badge>
                    </div>
                    {columnTasks.map((task) => (
                      <article key={task.id} className="grid gap-3 rounded-2xl border border-white/10 bg-[#10111d] p-3">
                        <div>
                          <strong className="block text-sm text-white">{task.title}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">{task.clientName}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={task.priority} />
                          {task.dueDate ? <Badge tone={task.dueDate < new Date() && task.status !== "completada" ? "red" : "muted"}>{formatDate(task.dueDate)}</Badge> : null}
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {task.responsibleName} - {task.hours.toFixed(1)} h
                        </p>
                        {task.projectId ? (
                          <Link href={`/projects/${task.projectId}`} className="text-xs font-bold text-primary">
                            {task.projectName}
                          </Link>
                        ) : null}
                        <TaskStatusForm taskId={task.id} status={task.status} />
                      </article>
                    ))}
                  </section>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Horas</CardDescription>
            <CardTitle>Base para imputacion</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Para cargar horas sobre tareas existentes, usa Equipo. Tareas disponibles: {tasks.length}.
          </p>
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
