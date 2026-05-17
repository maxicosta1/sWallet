import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      invoices: { where: { deletedAt: null }, include: { payments: true }, orderBy: { dueDate: "asc" } },
      payments: { where: { deletedAt: null }, orderBy: { dueDate: "asc" } },
      movements: { where: { deletedAt: null }, include: { category: true }, orderBy: { date: "desc" } },
      adminTasks: { where: { deletedAt: null }, orderBy: { dueDate: "asc" } },
      tasks: { where: { deletedAt: null }, orderBy: { position: "asc" } },
      budgets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      requests: { where: { deletedAt: null }, orderBy: { dueDate: "asc" } },
      responsibleTeamMember: true,
      timeEntries: { where: { deletedAt: null }, include: { teamMember: true }, orderBy: { date: "desc" } }
    }
  });

  if (!project) notFound();

  const invoiced = project.invoices.reduce((total, invoice) => total + invoiceTotal(invoice), 0);
  const paid = project.payments.reduce((total, payment) => total + decimalToNumber(payment.paidAmount), 0)
    || project.payments.filter((payment) => payment.status === "pagado").reduce((total, payment) => total + decimalToNumber(payment.amount), 0);
  const expenses = project.movements
    .filter((movement) => movement.type !== "ingreso")
    .reduce((total, movement) => total + decimalToNumber(movement.amount), 0);
  const hours = project.timeEntries.reduce((total, entry) => total + decimalToNumber(entry.hours), 0);
  const profit = paid - expenses;
  const completedChecklist = project.tasks.filter((task) => task.completed).length;
  const checklistProgress = project.tasks.length ? Math.round((completedChecklist / project.tasks.length) * 100) : project.progress;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Ficha de proyecto</CardDescription>
            <CardTitle className="text-2xl">{project.name}</CardTitle>
          </div>
          <StatusBadge status={project.status} />
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Cliente" value={project.client.company} href={`/clients/${project.clientId}`} />
            <Info label="Responsable" value={project.responsibleTeamMember?.name || project.responsible || "Sin responsable"} />
            <Info label="Entrega" value={project.dueAt ? formatDate(project.dueAt) : "Sin fecha"} />
            <Info label="Riesgo" value={project.risk || "normal"} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold text-white">Progreso operativo</span>
              <span className="text-muted-foreground">{checklistProgress}%</span>
            </div>
            <Progress value={checklistProgress} />
          </div>
          {project.description ? <p className="text-sm leading-6 text-muted-foreground">{project.description}</p> : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Presupuesto" value={formatCurrency(decimalToNumber(project.budget), project.currency)} />
        <Metric label="Facturado" value={formatCurrency(invoiced, project.currency)} />
        <Metric label="Cobrado" value={formatCurrency(paid, project.currency)} />
        <Metric label="Gastos" value={formatCurrency(expenses, project.currency)} />
        <Metric label="Ganancia" value={formatCurrency(profit, project.currency)} />
        <Metric label="Horas" value={`${hours.toFixed(1)} h`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Trabajo</CardDescription>
              <CardTitle>Tareas y checklist</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Tarea", "Responsable", "Vence", "Estado"]}
              rows={[
                ...project.adminTasks.map((task) => [
                  task.title,
                  task.responsible || "Sin responsable",
                  task.dueDate ? formatDate(task.dueDate) : "Sin fecha",
                  <StatusBadge key="status" status={task.status} />
                ]),
                ...project.tasks.map((task) => [
                  task.title,
                  "Checklist",
                  task.dueAt ? formatDate(task.dueAt) : "Sin fecha",
                  <StatusBadge key="status" status={task.completed ? "completada" : "pendiente"} />
                ])
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Dinero</CardDescription>
              <CardTitle>Facturas, pagos y caja</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Item", "Monto", "Fecha", "Estado"]}
              rows={[
                ...project.invoices.map((invoice) => [
                  `Factura ${invoice.number}`,
                  <CurrencyAmount key="invoice" value={invoiceTotal(invoice)} currency={invoice.currency} />,
                  formatDate(invoice.dueDate),
                  <StatusBadge key="status" status={invoice.status} />
                ]),
                ...project.payments.map((payment) => [
                  "Pago",
                  <CurrencyAmount key="payment" value={decimalToNumber(payment.paidAmount || payment.amount)} currency={payment.currency} />,
                  formatDate(payment.dueDate),
                  <StatusBadge key="status" status={payment.status} />
                ]),
                ...project.movements.map((movement) => [
                  movement.category.name,
                  <CurrencyAmount key="movement" value={decimalToNumber(movement.amount)} currency={movement.currency} />,
                  formatDate(movement.date),
                  <StatusBadge key="status" status={movement.type} />
                ])
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Comercial</CardDescription>
              <CardTitle>Presupuestos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Presupuesto", "Validez", "Estado"]}
              rows={project.budgets.map((budget) => [
                budget.projectName,
                budget.validUntil ? formatDate(budget.validUntil) : "Sin vencimiento",
                <StatusBadge key="status" status={budget.status} />
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Documentacion</CardDescription>
              <CardTitle>Documentos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Documento", "Tipo", "Link"]}
              rows={project.documents.map((document) => [
                document.name,
                document.type,
                document.link ? <Link key="doc" href={document.link} className="text-primary">Abrir</Link> : "Sin link"
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Equipo</CardDescription>
              <CardTitle>Horas registradas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Persona", "Horas", "Fecha"]}
              rows={project.timeEntries.map((entry) => [
                entry.teamMember.name,
                `${decimalToNumber(entry.hours)} h`,
                formatDate(entry.date)
              ])}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function invoiceTotal(invoice: { total: unknown; amount: unknown }) {
  return decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
        <strong className="mt-2 block text-xl font-black text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-white">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/40 hover:bg-primary/10">
        {content}
      </Link>
    );
  }

  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">{content}</div>;
}
