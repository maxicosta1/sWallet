import { currentUser } from "./auth.js";
import { parseDate, startOfDay, state, DAY_MS } from "./state.js";

export function scoped(collection) {
  const user = currentUser();
  if (!user) return [];
  return state[collection].filter((item) => !item.userId || item.userId === user.id);
}

export function clients() {
  return scoped("clients");
}

export function projects() {
  return scoped("projects").filter((project) => clientExists(project.clientId));
}

export function invoices() {
  return scoped("invoices").filter((invoice) => clientExists(invoice.clientId));
}

export function payments() {
  return scoped("payments").filter((payment) => clientExists(payment.clientId));
}

export function movements() {
  return scoped("movements");
}

export function subscriptions() {
  return scoped("subscriptions");
}

export function clientExists(clientId) {
  return clients().some((client) => client.id === clientId);
}

export function projectExists(projectId, clientId = "") {
  return projects().some((project) => project.id === projectId && (!clientId || project.clientId === clientId));
}

export function toARS(amount, currency) {
  return currency === "USD" ? Number(amount) * state.exchangeRate : Number(amount);
}

export function paidForInvoice(invoiceId) {
  return payments()
    .filter((payment) => payment.invoiceId === invoiceId && payment.status === "pagado")
    .reduce((total, payment) => total + toARS(payment.amount, payment.currency), 0);
}

export function invoiceAmountARS(invoice) {
  return toARS(invoice.amount, invoice.currency);
}

export function normalizedInvoiceStatus(invoice) {
  if (invoice.status === "pendiente" && startOfDay(parseDate(invoice.dueDate)) < startOfDay(new Date())) {
    return "vencida";
  }
  return invoice.status;
}

export function filteredInvoices(filters = state.billingFilters) {
  return invoices().filter((invoice) => {
    const status = normalizedInvoiceStatus(invoice);
    const date = startOfDay(parseDate(invoice.issueDate));

    if (filters.clientId && invoice.clientId !== filters.clientId) return false;
    if (filters.projectId && invoice.projectId !== filters.projectId) return false;
    if (filters.status && status !== filters.status) return false;
    if (filters.currency && invoice.currency !== filters.currency) return false;
    if (filters.from && date < startOfDay(parseDate(filters.from))) return false;
    if (filters.to && date > startOfDay(parseDate(filters.to))) return false;
    if (filters.quick === "vencidas" && status !== "vencida") return false;
    if (filters.quick === "pagadas" && status !== "pagada") return false;
    if (filters.quick === "pendientes" && status !== "pendiente") return false;
    return true;
  });
}

export function billingSummaryByClient(filters = state.billingFilters) {
  const list = filteredInvoices(filters);

  return clients()
    .filter((client) => !filters.clientId || client.id === filters.clientId)
    .map((client) => {
      const clientInvoices = list.filter((invoice) => invoice.clientId === client.id);
      const projectIds = new Set(clientInvoices.map((invoice) => invoice.projectId).filter(Boolean));
      const clientPayments = payments().filter((payment) => payment.clientId === client.id);
      const totalFacturado = clientInvoices.reduce((total, invoice) => total + invoiceAmountARS(invoice), 0);
      const totalCobrado = clientInvoices.reduce((total, invoice) => total + paidForInvoice(invoice.id), 0);
      const totalPendiente = Math.max(totalFacturado - totalCobrado, 0);
      const totalVencido = clientInvoices
        .filter((invoice) => normalizedInvoiceStatus(invoice) === "vencida")
        .reduce((total, invoice) => total + Math.max(invoiceAmountARS(invoice) - paidForInvoice(invoice.id), 0), 0);
      const lastPayment = clientPayments
        .filter((payment) => payment.status === "pagado")
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];
      const nextDue = clientInvoices
        .filter((invoice) => ["pendiente", "vencida"].includes(normalizedInvoiceStatus(invoice)))
        .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))[0];

      return {
        client,
        invoices: clientInvoices,
        totalFacturado,
        totalCobrado,
        totalPendiente,
        totalVencido,
        invoiceCount: clientInvoices.length,
        projectCount: projectIds.size,
        lastPayment,
        nextDue,
        status: totalVencido > 0 ? "deuda vencida" : totalPendiente > 0 ? "deuda pendiente" : "al dia"
      };
    })
    .filter((summary) => summary.invoiceCount > 0 || !filters.clientId);
}

export function billingTotals(filters = state.billingFilters) {
  return billingSummaryByClient(filters).reduce(
    (acc, summary) => {
      acc.facturado += summary.totalFacturado;
      acc.cobrado += summary.totalCobrado;
      acc.pendiente += summary.totalPendiente;
      acc.vencido += summary.totalVencido;
      acc.facturas += summary.invoiceCount;
      return acc;
    },
    { facturado: 0, cobrado: 0, pendiente: 0, vencido: 0, facturas: 0 }
  );
}

export function totalsForMonth(date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const monthInvoices = invoices().filter((invoice) => {
    const invoiceDate = parseDate(invoice.issueDate);
    return invoiceDate.getMonth() === month && invoiceDate.getFullYear() === year;
  });
  const monthPayments = payments().filter((payment) => {
    const paymentDate = parseDate(payment.date);
    return payment.status === "pagado" && paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
  });
  const monthMovements = movements().filter((movement) => {
    const movementDate = parseDate(movement.date);
    return movementDate.getMonth() === month && movementDate.getFullYear() === year;
  });

  const income = monthPayments.reduce((total, payment) => total + toARS(payment.amount, payment.currency), 0)
    + monthMovements.filter((item) => item.type === "ingreso").reduce((total, item) => total + toARS(item.amount, item.currency), 0);
  const expenses = monthMovements.filter((item) => item.type === "salida").reduce((total, item) => total + toARS(item.amount, item.currency), 0);
  const pending = monthInvoices
    .filter((invoice) => normalizedInvoiceStatus(invoice) !== "pagada")
    .reduce((total, invoice) => total + Math.max(invoiceAmountARS(invoice) - paidForInvoice(invoice.id), 0), 0);

  return { income, expenses, pending, estimated: income + pending - expenses, profit: income - expenses };
}

export function globalTotals() {
  const incomeARS = payments().filter((payment) => payment.status === "pagado").reduce((total, payment) => total + toARS(payment.amount, payment.currency), 0)
    + movements().filter((item) => item.type === "ingreso").reduce((total, item) => total + toARS(item.amount, item.currency), 0);
  const expensesARS = movements().filter((item) => item.type === "salida").reduce((total, item) => total + toARS(item.amount, item.currency), 0);

  return {
    balanceARS: incomeARS - expensesARS,
    ars: balanceByCurrency("ARS"),
    usd: balanceByCurrency("USD")
  };
}

export function balanceByCurrency(currency) {
  const paid = payments().filter((payment) => payment.status === "pagado" && payment.currency === currency).reduce((total, payment) => total + Number(payment.amount), 0);
  const income = movements().filter((item) => item.type === "ingreso" && item.currency === currency).reduce((total, item) => total + Number(item.amount), 0);
  const expenses = movements().filter((item) => item.type === "salida" && item.currency === currency).reduce((total, item) => total + Number(item.amount), 0);
  return paid + income - expenses;
}

export function upcomingPayments() {
  const limit = startOfDay(new Date(Date.now() + 10 * DAY_MS));
  return invoices()
    .filter((invoice) => ["pendiente", "vencida"].includes(normalizedInvoiceStatus(invoice)))
    .filter((invoice) => startOfDay(parseDate(invoice.dueDate)) <= limit)
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))
    .slice(0, 5);
}
