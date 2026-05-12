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

export function tasks() {
  return scoped("tasks").filter((task) => !task.clientId || clientExists(task.clientId));
}

export function goals() {
  return scoped("goals");
}

export function requests() {
  return scoped("requests").filter((request) => !request.clientId || clientExists(request.clientId));
}

export function notes() {
  return scoped("notes").filter((note) => !note.clientId || clientExists(note.clientId));
}

export function actions() {
  return scoped("actions").filter((action) => !action.clientId || clientExists(action.clientId));
}

export function opportunities() {
  return scoped("opportunities").filter((item) => !item.clientId || clientExists(item.clientId));
}

export function budgets() {
  return scoped("budgets").filter((item) => !item.clientId || clientExists(item.clientId));
}

export function calendarEvents() {
  return scoped("calendarEvents").filter((item) => !item.clientId || clientExists(item.clientId));
}

export function documents() {
  return scoped("documents").filter((item) => !item.clientId || clientExists(item.clientId));
}

export function supportPlans() {
  return scoped("supportPlans").filter((item) => !item.clientId || clientExists(item.clientId));
}

export function teamMembers() {
  return scoped("teamMembers");
}

export function marketingCampaigns() {
  return scoped("marketingCampaigns");
}

export function clientPortalItems() {
  return scoped("clientPortalItems").filter((item) => !item.clientId || clientExists(item.clientId));
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

export function projectFinancials(projectId) {
  const project = projects().find((item) => item.id === projectId);
  if (!project) return { budget: 0, paid: 0, expenses: 0, pending: 0, profit: 0 };
  const paid = payments()
    .filter((payment) => payment.projectId === projectId && payment.status === "pagado")
    .reduce((total, payment) => total + toARS(payment.amount, payment.currency), 0);
  const manualPaid = toARS(project.paid || 0, project.currency || "ARS");
  const budget = toARS(project.budget || 0, project.currency || "ARS");
  const expenses = toARS(project.expenses || 0, project.currency || "ARS");
  const collected = Math.max(paid, manualPaid);
  return {
    budget,
    paid: collected,
    expenses,
    pending: Math.max(budget - collected, 0),
    profit: collected - expenses
  };
}

export function clientHealth(clientId) {
  const summary = billingSummaryByClient({ clientId, projectId: "", status: "", currency: "", from: "", to: "", quick: "" })[0];
  const overdueInvoices = invoices().filter((invoice) => invoice.clientId === clientId && normalizedInvoiceStatus(invoice) === "vencida").length;
  const overdueTasks = tasks().filter((task) => task.clientId === clientId && !["completada", "cancelada"].includes(task.status) && startOfDay(parseDate(task.dueDate)) < startOfDay(new Date())).length;
  const riskNotes = notes().filter((note) => note.clientId === clientId && [note.tone, note.content, note.title].join(" ").toLowerCase().includes("riesgo")).length;
  const client = clients().find((item) => item.id === clientId);
  const lastContact = client?.lastContact ? Math.floor((Date.now() - parseDate(client.lastContact).getTime()) / DAY_MS) : 999;
  const score = 100 - overdueInvoices * 30 - overdueTasks * 18 - riskNotes * 15 - (summary?.totalPendiente ? 12 : 0) - (lastContact > 21 ? 12 : 0);
  if (score < 55) return { label: "En riesgo", tone: "riesgo", score: Math.max(score, 0) };
  if (score < 78) return { label: "Neutral", tone: "neutral", score };
  return { label: "Saludable", tone: "saludable", score };
}

export function companyProgress() {
  const activeProjects = projects().filter((project) => !["finalizado", "entregado", "cancelado"].includes(project.status));
  const projectProgress = activeProjects.length ? activeProjects.reduce((total, project) => total + Number(project.progress || 0), 0) / activeProjects.length : 100;
  const goalProgress = goals().length ? goals().reduce((total, goal) => total + goalProgressPercent(goal), 0) / goals().length : 100;
  const totals = billingTotals();
  const collection = totals.facturado ? (totals.cobrado / totals.facturado) * 100 : 100;
  return Math.round((projectProgress + goalProgress + collection) / 3);
}

export function goalProgressPercent(goal) {
  return Math.min(Math.round((Number(goal.current || 0) / Math.max(Number(goal.target || 1), 1)) * 100), 100);
}

export function notifications() {
  const today = startOfDay(new Date());
  const soon = startOfDay(new Date(Date.now() + 5 * DAY_MS));
  const rows = [];

  invoices().forEach((invoice) => {
    const status = normalizedInvoiceStatus(invoice);
    if (status === "vencida") rows.push({ type: "Pago vencido", tone: "vencida", title: invoice.number, detail: clientName(invoice.clientId), date: invoice.dueDate });
    else if (status === "pendiente" && startOfDay(parseDate(invoice.dueDate)) <= soon) rows.push({ type: "Cobro proximo", tone: "pendiente", title: invoice.number, detail: clientName(invoice.clientId), date: invoice.dueDate });
  });

  tasks().forEach((task) => {
    const due = startOfDay(parseDate(task.dueDate));
    if (!["completada", "cancelada"].includes(task.status) && due < today) rows.push({ type: "Tarea vencida", tone: "vencida", title: task.title, detail: clientName(task.clientId), date: task.dueDate });
    else if (!["completada", "cancelada"].includes(task.status) && due <= soon) rows.push({ type: "Tarea proxima", tone: "pendiente", title: task.title, detail: clientName(task.clientId), date: task.dueDate });
  });

  clients().forEach((client) => {
    if (client.lastContact && Math.floor((Date.now() - parseDate(client.lastContact).getTime()) / DAY_MS) > 21) {
      rows.push({ type: "Sin contacto", tone: "neutral", title: client.company, detail: "Seguimiento comercial recomendado", date: client.lastContact });
    }
  });

  projects().forEach((project) => {
    if (project.dueDate && !["finalizado", "entregado", "cancelado"].includes(project.status) && startOfDay(parseDate(project.dueDate)) < today) {
      rows.push({ type: "Proyecto atrasado", tone: "vencida", title: project.name, detail: clientName(project.clientId), date: project.dueDate });
    }
  });

  requests().filter((request) => request.priority === "urgente" && request.status !== "completado").forEach((request) => {
    rows.push({ type: "Pedido urgente", tone: "coral", title: request.description, detail: clientName(request.clientId), date: request.dueDate || request.date });
  });

  budgets().filter((budget) => ["enviado", "borrador"].includes(budget.status) && budget.validUntil && startOfDay(parseDate(budget.validUntil)) <= soon).forEach((budget) => {
    rows.push({ type: "Presupuesto", tone: startOfDay(parseDate(budget.validUntil)) < today ? "vencida" : "pendiente", title: budget.projectName, detail: clientName(budget.clientId), date: budget.validUntil });
  });

  calendarEvents().filter((event) => event.date && event.status !== "completado" && startOfDay(parseDate(event.date)) <= soon).forEach((event) => {
    rows.push({ type: "Calendario", tone: event.priority === "urgente" ? "coral" : "pendiente", title: event.title, detail: clientName(event.clientId), date: event.date });
  });

  supportPlans().forEach((plan) => {
    [plan.domainRenewal, plan.hostingRenewal].filter(Boolean).forEach((date) => {
      if (startOfDay(parseDate(date)) <= soon) rows.push({ type: "Renovacion", tone: "pendiente", title: plan.domain || plan.url, detail: clientName(plan.clientId), date });
    });
  });

  return rows.sort((a, b) => parseDate(a.date) - parseDate(b.date)).slice(0, 12);
}

export function clientAdminSummary(client) {
  const clientProjects = projects().filter((project) => project.clientId === client.id);
  const activeProject = clientProjects.find((project) => !["finalizado", "entregado", "cancelado"].includes(project.status));
  const clientRequests = requests().filter((request) => request.clientId === client.id);
  const clientTasks = tasks().filter((task) => task.clientId === client.id);
  const clientActions = actions().filter((action) => action.clientId === client.id && action.status !== "completada");
  const summary = billingSummaryByClient({ clientId: client.id, projectId: "", status: "", currency: "", from: "", to: "", quick: "" })[0];
  return {
    client,
    activeProject,
    asked: clientRequests.filter((request) => request.status !== "completado").map((request) => request.description).slice(0, 2).join("; ") || "Sin pedidos abiertos",
    pendingWork: clientTasks.filter((task) => !["completada", "cancelada"].includes(task.status)).length,
    delivered: clientTasks.filter((task) => task.status === "completada").length,
    pendingMoney: summary?.totalPendiente || 0,
    nextAction: clientActions.sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))[0]?.title || "Definir proxima accion",
    priority: client.priority || "media",
    health: clientHealth(client.id)
  };
}

export function searchResults(query = state.globalSearch) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return [];
  const includes = (values) => values.filter(Boolean).join(" ").toLowerCase().includes(term);
  return [
    ...clients().filter((client) => includes([client.name, client.company, client.email, client.service, client.observations])).map((item) => ({ type: "Cliente", title: item.company, detail: item.name, view: "clientes" })),
    ...projects().filter((project) => includes([project.name, project.description, project.technologies, project.responsible])).map((item) => ({ type: "Proyecto", title: item.name, detail: clientName(item.clientId), view: "proyectos" })),
    ...invoices().filter((invoice) => includes([invoice.number, invoice.notes])).map((item) => ({ type: "Factura", title: item.number, detail: clientName(item.clientId), view: "facturacion" })),
    ...payments().filter((payment) => includes([payment.method, payment.notes])).map((item) => ({ type: "Pago", title: clientName(item.clientId), detail: payment.notes || payment.method, view: "pagos" })),
    ...tasks().filter((task) => includes([task.title, task.description, task.responsible, task.comments])).map((item) => ({ type: "Tarea", title: item.title, detail: clientName(item.clientId), view: "tareas" })),
    ...requests().filter((request) => includes([request.description, request.type, request.responsible, request.notes])).map((item) => ({ type: "Pedido", title: item.description, detail: clientName(item.clientId), view: "administracion" })),
    ...notes().filter((note) => includes([note.title, note.content])).map((item) => ({ type: "Nota", title: item.title, detail: clientName(item.clientId), view: "administracion" })),
    ...opportunities().filter((item) => includes([item.title, item.service, item.nextAction, item.responsible])).map((item) => ({ type: "CRM", title: item.title, detail: clientName(item.clientId), view: "crm" })),
    ...budgets().filter((item) => includes([item.projectName, item.services, item.notes])).map((item) => ({ type: "Presupuesto", title: item.projectName, detail: clientName(item.clientId), view: "presupuestos" })),
    ...calendarEvents().filter((item) => includes([item.title, item.type, item.description])).map((item) => ({ type: "Calendario", title: item.title, detail: clientName(item.clientId), view: "calendario" })),
    ...documents().filter((item) => includes([item.name, item.type, item.tags, item.description])).map((item) => ({ type: "Documento", title: item.name, detail: clientName(item.clientId), view: "documentos" })),
    ...supportPlans().filter((item) => includes([item.url, item.domain, item.hosting, item.plan, item.notes])).map((item) => ({ type: "Soporte", title: item.domain || item.url, detail: clientName(item.clientId), view: "soporte" })),
    ...marketingCampaigns().filter((item) => includes([item.name, item.target, item.message])).map((item) => ({ type: "Marketing", title: item.name, detail: item.target, view: "marketing" }))
  ].slice(0, 12);
}

function clientName(clientId) {
  const client = clients().find((item) => item.id === clientId);
  return client ? client.company : "Sin cliente";
}
