import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export type OperationsData = Awaited<ReturnType<typeof getOperationsData>>;

export async function getOperationsData() {
  const [clients, projects, teamMembers, tasks, timeEntries] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: [{ company: "asc" }, { name: "asc" }]
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.teamMember.findMany({
      where: { deletedAt: null },
      include: {
        responsibleProjects: { where: { deletedAt: null }, select: { id: true, name: true, progress: true, status: true } },
        assignedTasks: { where: { deletedAt: null }, select: { id: true, title: true, status: true, priority: true, dueDate: true } },
        timeEntries: { where: { deletedAt: null }, select: { hours: true } }
      },
      orderBy: [{ status: "asc" }, { name: "asc" }]
    }),
    prisma.adminTask.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        project: true,
        responsibleTeamMember: true,
        timeEntries: { where: { deletedAt: null }, select: { hours: true } }
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.timeEntry.findMany({
      where: { deletedAt: null },
      include: {
        teamMember: true,
        project: { include: { client: true } },
        task: true
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 30
    })
  ]);

  return {
    clients: clients.map((client) => ({ id: client.id, label: `${client.company} - ${client.name}` })),
    projects: projects.map((project) => ({
      id: project.id,
      clientId: project.clientId,
      label: `${project.name} - ${project.client.company}`,
      status: project.status,
      progress: project.progress,
      dueAt: project.dueAt
    })),
    teamMembers: teamMembers.map((member) => {
      const completedTasks = member.assignedTasks.filter((task) => task.status === "completada").length;
      const pendingTasks = member.assignedTasks.filter((task) => task.status !== "completada" && task.status !== "cancelada").length;
      const hours = member.timeEntries.reduce((sum, entry) => sum + decimalToNumber(entry.hours), 0);

      return {
        id: member.id,
        name: member.name,
        lastName: member.lastName,
        fullName: [member.name, member.lastName].filter(Boolean).join(" "),
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: member.status,
        focus: member.focus,
        responsibilities: member.responsibilities,
        notes: member.notes,
        projectCount: member.responsibleProjects.length,
        taskCount: member.assignedTasks.length,
        completedTasks,
        pendingTasks,
        hours
      };
    }),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      clientName: task.client?.company ?? "Sin cliente",
      projectId: task.projectId,
      projectName: task.project?.name ?? "Sin proyecto",
      responsibleName: task.responsibleTeamMember
        ? [task.responsibleTeamMember.name, task.responsibleTeamMember.lastName].filter(Boolean).join(" ")
        : task.responsible || "Sin responsable",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      hours: task.timeEntries.reduce((sum, entry) => sum + decimalToNumber(entry.hours), 0)
    })),
    timeEntries: timeEntries.map((entry) => ({
      id: entry.id,
      teamMemberName: [entry.teamMember.name, entry.teamMember.lastName].filter(Boolean).join(" "),
      projectName: entry.project?.name ?? "Sin proyecto",
      clientName: entry.project?.client.company ?? null,
      taskTitle: entry.task?.title ?? "Sin tarea",
      hours: decimalToNumber(entry.hours),
      date: entry.date,
      comment: entry.comment
    }))
  };
}
