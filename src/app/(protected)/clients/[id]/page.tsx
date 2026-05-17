import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CurrencyAmount } from "@/components/dashboard/currency-amount";

export const dynamic = "force-dynamic";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      projects: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
      invoices: { where: { deletedAt: null }, include: { payments: true }, orderBy: { dueDate: "asc" } },
      payments: { where: { deletedAt: null }, include: { invoice: true }, orderBy: { dueDate: "asc" } },
      tasks: { where: { deletedAt: null }, orderBy: { dueDate: "asc" } },
      budgets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      notes: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 5 },
      opportunities: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 8 }
    }
  });

  if (!client) notFound();

  const totalFacturado = client.invoices.reduce((total, invoice) => total + invoiceTotal(invoice), 0);
  const totalCobrado = client.payments.reduce((total, payment) => total + decimalToNumber(payment.paidAmount), 0);
  const fallbackCobrado = client.payments
    .filter((payment) => payment.status === "pagado")
    .reduce((total, payment) => total + decimalToNumber(payment.amount), 0);
  const cobrado = totalCobrado || fallbackCobrado;
  const pendiente = Math.max((totalFacturado || decimalToNumber(client.agreedPrice)) - cobrado, 0);
  const vencidas = client.invoices.filter((invoice) => invoice.status === "vencida" || (invoice.status === "pendiente" && invoice.dueDate < new Date()));
  const ultimoPago = client.payments
    .filter((payment) => payment.status === "pagado")
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Ficha de cliente</CardDescription>
            <CardTitle className="text-2xl">{client.company}</CardTitle>
          </div>
          <StatusBadge status={client.status} />
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Contacto" value={`${client.name} - ${client.email}`} />
            <Info label="Telefono" value={client.phone} />
            <Info label="Servicio" value={client.service} />
            <Info label="Prioridad" value={client.priority} />
          </div>
          {client.observations ? <p className="text-sm leading-6 text-muted-foreground">{client.observations}</p> : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total presupuestado" value={formatCurrency(decimalToNumber(client.agreedPrice), client.currency)} />
        <Metric label="Total facturado" value={formatCurrency(totalFacturado, client.currency)} />
        <Metric label="Total cobrado" value={formatCurrency(cobrado, client.currency)} />
        <Metric label="Pendiente" value={formatCurrency(pendiente, client.currency)} />
        <Metric label="Facturas vencidas" value={String(vencidas.length)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Delivery</CardDescription>
              <CardTitle>Proyectos asociados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Proyecto", "Presupuesto", "Progreso", "Entrega", "Estado"]}
              rows={client.projects.map((project) => [
                <Link key="project" href={`/projects/${project.id}`} className="font-bold transition hover:text-primary">{project.name}</Link>,
                <CurrencyAmount key="budget" value={decimalToNumber(project.budget)} currency={project.currency} />,
                `${project.progress}%`,
                project.dueAt ? formatDate(project.dueAt) : "Sin fecha",
                <StatusBadge key="status" status={project.status} />
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Cobranza</CardDescription>
              <CardTitle>Facturas y pagos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Factura/Pago", "Monto", "Vence", "Estado"]}
              rows={[
                ...client.invoices.map((invoice) => [
                  `Factura ${invoice.number}`,
                  <CurrencyAmount key="invoice" value={invoiceTotal(invoice)} currency={invoice.currency} />,
                  formatDate(invoice.dueDate),
                  <StatusBadge key="status" status={invoice.status} />
                ]),
                ...client.payments.map((payment) => [
                  payment.invoice ? `Pago de ${payment.invoice.number}` : "Pago sin factura",
                  <CurrencyAmount key="payment" value={decimalToNumber(payment.paidAmount || payment.amount)} currency={payment.currency} />,
                  formatDate(payment.dueDate),
                  <StatusBadge key="status" status={payment.status} />
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
              <CardDescription>Operacion</CardDescription>
              <CardTitle>Tareas relacionadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Tarea", "Prioridad", "Vence", "Estado"]}
              rows={client.tasks.map((task) => [
                task.title,
                task.priority,
                task.dueDate ? formatDate(task.dueDate) : "Sin fecha",
                <StatusBadge key="status" status={task.status} />
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Comercial</CardDescription>
              <CardTitle>CRM y presupuestos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Item", "Valor", "Estado"]}
              rows={[
                ...client.opportunities.map((opportunity) => [
                  opportunity.title,
                  <CurrencyAmount key="value" value={decimalToNumber(opportunity.value)} currency={opportunity.currency} />,
                  <StatusBadge key="status" status={opportunity.status} />
                ]),
                ...client.budgets.map((budget) => [
                  budget.projectName,
                  budget.validUntil ? formatDate(budget.validUntil) : "Sin vencimiento",
                  <StatusBadge key="status" status={budget.status} />
                ])
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Historial</CardDescription>
              <CardTitle>Notas y actividad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Info label="Ultimo pago" value={ultimoPago ? formatDate(ultimoPago.date) : "Sin pagos confirmados"} />
            <Info label="Documentos" value={String(client.documents.length)} />
            {client.notes.map((note) => (
              <p key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-muted-foreground">{note.body}</p>
            ))}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}
