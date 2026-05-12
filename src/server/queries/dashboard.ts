import { prisma } from "@/lib/prisma";
import { convertToARS, daysFromNow, monthBounds } from "@/lib/finance";
import { decimalToNumber } from "@/lib/format";
import type { Currency, MovementType, PaymentStatus } from "@prisma/client";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData() {
  const [{ start, end }, exchangeRate, clients, payments, movements, projects, subscriptions] = await Promise.all([
    Promise.resolve(monthBounds()),
    getActiveExchangeRate(),
    prisma.client.findMany({
      where: { deletedAt: null },
      include: {
        payments: { where: { deletedAt: null } },
        projects: { where: { deletedAt: null } },
        notes: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 3 }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.payment.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.movement.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { date: "desc" }
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true, tasks: { orderBy: { position: "asc" } } },
      orderBy: { dueAt: "asc" }
    }),
    prisma.subscription.findMany({
      where: { deletedAt: null },
      orderBy: { renewsAt: "asc" }
    })
  ]);

  const paidPayments = payments.filter((payment) => payment.status === "pagado");
  const monthPaidPayments = paidPayments.filter((payment) => within(payment.date, start, end));
  const monthMovements = movements.filter((movement) => within(movement.date, start, end));
  const incomeMovements = movements.filter((movement) => movement.type === "ingreso");
  const expenseMovements = movements.filter((movement) => movement.type === "gasto" || movement.type === "inversion");
  const monthIncomeMovements = monthMovements.filter((movement) => movement.type === "ingreso");
  const monthExpenseMovements = monthMovements.filter((movement) => movement.type === "gasto" || movement.type === "inversion");
  const pendingPayments = payments.filter((payment) => payment.status === "pendiente" || payment.status === "vencido");
  const duePayments = payments.filter((payment) => payment.status === "vencido" || (payment.status === "pendiente" && payment.dueDate < new Date()));

  const income = sumPaymentsARS(paidPayments, exchangeRate) + sumMovementsARS(incomeMovements, exchangeRate);
  const expenses = sumMovementsARS(expenseMovements, exchangeRate);
  const monthIncome = sumPaymentsARS(monthPaidPayments, exchangeRate) + sumMovementsARS(monthIncomeMovements, exchangeRate);
  const monthExpenses = sumMovementsARS(monthExpenseMovements, exchangeRate);
  const pendingARS = sumPaymentsDebtARS(pendingPayments, exchangeRate);
  const netProfit = monthIncome - monthExpenses;

  return {
    exchangeRate,
    metrics: {
      totalBalanceARS: income - expenses,
      monthIncome,
      monthExpenses,
      netProfit,
      estimatedMonth: monthIncome + pendingARS - monthExpenses,
      balanceARS: balanceByCurrency(payments, movements, "ARS"),
      balanceUSD: balanceByCurrency(payments, movements, "USD"),
      activeClients: clients.filter((client) => ["activo", "en_desarrollo", "mantenimiento"].includes(client.status)).length,
      debtClients: clients.filter((client) => client.payments.some((payment) => payment.status === "pendiente" || payment.status === "vencido")).length,
      duePayments: duePayments.length
    },
    clients: clients.map((client) => {
      const generated = sumPaymentsARS(client.payments.filter((payment) => payment.status === "pagado"), exchangeRate);
      const debt = sumPaymentsDebtARS(client.payments.filter((payment) => payment.status !== "pagado"), exchangeRate);
      return {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        service: client.service,
        agreedPrice: decimalToNumber(client.agreedPrice),
        currency: client.currency,
        status: client.status,
        startDate: client.startDate,
        observations: client.observations,
        generated,
        debt,
        profitability: generated - debt,
        projectCount: client.projects.length,
        noteCount: client.notes.length
      };
    }),
    payments: payments.map((payment) => ({
      id: payment.id,
      clientId: payment.clientId,
      clientName: payment.client.company,
      amount: decimalToNumber(payment.amount),
      paidAmount: decimalToNumber(payment.paidAmount),
      currency: payment.currency,
      date: payment.date,
      dueDate: payment.dueDate,
      status: normalizePaymentStatus(payment.status, payment.dueDate),
      method: payment.method,
      isRecurring: payment.isRecurring,
      notes: payment.notes
    })),
    movements: movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      category: movement.category.name,
      categoryColor: movement.category.color,
      description: movement.description,
      amount: decimalToNumber(movement.amount),
      currency: movement.currency,
      date: movement.date
    })),
    projects: projects.map((project) => ({
      id: project.id,
      clientName: project.client.company,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      budget: decimalToNumber(project.budget),
      currency: project.currency,
      dueAt: project.dueAt,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        completed: task.completed
      }))
    })),
    subscriptions: subscriptions.map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      provider: subscription.provider,
      category: subscription.category,
      monthlyCost: decimalToNumber(subscription.monthlyCost),
      annualCost: decimalToNumber(subscription.annualCost),
      currency: subscription.currency,
      renewsAt: subscription.renewsAt,
      status: subscription.status
    })),
    charts: {
      monthly: buildMonthlySeries(payments, movements, exchangeRate),
      services: buildServiceSeries(clients),
      profitableClients: clients
        .map((client) => ({
          name: client.company,
          value: sumPaymentsARS(client.payments.filter((payment) => payment.status === "pagado"), exchangeRate)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    },
    alerts: {
      upcomingPayments: payments
        .filter((payment) => payment.status !== "pagado" && payment.status !== "cancelado" && payment.dueDate <= daysFromNow(10))
        .slice(0, 6)
        .map((payment) => ({
          id: payment.id,
          clientName: payment.client.company,
          amount: decimalToNumber(payment.amount),
          paidAmount: decimalToNumber(payment.paidAmount),
          currency: payment.currency,
          dueDate: payment.dueDate,
          status: normalizePaymentStatus(payment.status, payment.dueDate)
        })),
      renewals: subscriptions.filter((subscription) => subscription.renewsAt <= daysFromNow(21)).slice(0, 5)
    },
    recentActivity: buildRecentActivity(payments, movements)
  };
}

export async function getActiveExchangeRate() {
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { validAt: "desc" }
  });

  return latest ? decimalToNumber(latest.rate) : 1200;
}

function within(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function sumPaymentsARS(payments: Array<{ amount: unknown; currency: Currency }>, rate: number) {
  return payments.reduce((total, payment) => total + convertToARS(decimalToNumber(payment.amount), payment.currency, rate), 0);
}

function sumPaymentsDebtARS(payments: Array<{ amount: unknown; paidAmount: unknown; currency: Currency }>, rate: number) {
  return payments.reduce((total, payment) => {
    const debt = Math.max(decimalToNumber(payment.amount) - decimalToNumber(payment.paidAmount), 0);
    return total + convertToARS(debt, payment.currency, rate);
  }, 0);
}

function sumMovementsARS(movements: Array<{ amount: unknown; currency: Currency }>, rate: number) {
  return movements.reduce((total, movement) => total + convertToARS(decimalToNumber(movement.amount), movement.currency, rate), 0);
}

function balanceByCurrency(
  payments: Array<{ amount: unknown; currency: Currency; status: PaymentStatus }>,
  movements: Array<{ amount: unknown; currency: Currency; type: MovementType }>,
  currency: Currency
) {
  const paid = payments
    .filter((payment) => payment.status === "pagado" && payment.currency === currency)
    .reduce((total, payment) => total + decimalToNumber(payment.amount), 0);
  const income = movements
    .filter((movement) => movement.type === "ingreso" && movement.currency === currency)
    .reduce((total, movement) => total + decimalToNumber(movement.amount), 0);
  const out = movements
    .filter((movement) => movement.type !== "ingreso" && movement.currency === currency)
    .reduce((total, movement) => total + decimalToNumber(movement.amount), 0);
  return paid + income - out;
}

function normalizePaymentStatus(status: PaymentStatus, dueDate: Date) {
  if (status === "pendiente" && dueDate < new Date()) return "vencido";
  return status;
}

function buildMonthlySeries(
  payments: Array<{ amount: unknown; currency: Currency; status: PaymentStatus; date: Date }>,
  movements: Array<{ amount: unknown; currency: Currency; type: MovementType; date: Date }>,
  rate: number
) {
  return Array.from({ length: 6 }, (_, index) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthPayments = payments.filter((payment) => payment.status === "pagado" && within(payment.date, start, end));
    const monthMovements = movements.filter((movement) => within(movement.date, start, end));
    const income = sumPaymentsARS(monthPayments, rate) + sumMovementsARS(monthMovements.filter((movement) => movement.type === "ingreso"), rate);
    const expenses = sumMovementsARS(monthMovements.filter((movement) => movement.type !== "ingreso"), rate);

    return {
      month: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date),
      ingresos: income,
      egresos: expenses,
      saldo: income - expenses
    };
  });
}

function buildServiceSeries(clients: Array<{ service: string }>) {
  const grouped = clients.reduce<Record<string, number>>((acc, client) => {
    acc[client.service] = (acc[client.service] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

function buildRecentActivity(
  payments: Array<{ id: string; amount: unknown; currency: Currency; date: Date; dueDate: Date; status: PaymentStatus; client: { company: string } }>,
  movements: Array<{ id: string; amount: unknown; currency: Currency; date: Date; type: MovementType; description: string }>
) {
  return [
    ...payments.map((payment) => ({
      id: payment.id,
      title: payment.client.company,
      description: `Pago ${normalizePaymentStatus(payment.status, payment.dueDate)}`,
      amount: decimalToNumber(payment.amount),
      currency: payment.currency,
      date: payment.date,
      kind: "payment" as const
    })),
    ...movements.map((movement) => ({
      id: movement.id,
      title: movement.type,
      description: movement.description,
      amount: decimalToNumber(movement.amount),
      currency: movement.currency,
      date: movement.date,
      kind: "movement" as const
    }))
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);
}
