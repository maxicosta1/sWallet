import { canDelete, canWrite, currentUser, hasUsers, isAuthenticated } from "./auth.js";
import {
  billingSummaryByClient,
  billingTotals,
  clients,
  filteredInvoices,
  globalTotals,
  invoiceAmountARS,
  movements,
  normalizedInvoiceStatus,
  paidForInvoice,
  payments,
  projects,
  subscriptions,
  totalsForMonth,
  upcomingPayments
} from "./finance.js";
import { parseDate, state, toInputDate, DAY_MS } from "./state.js";

export const dom = {};

const titles = {
  dashboard: "Dashboard financiero",
  clientes: "Clientes",
  pagos: "Pagos",
  facturacion: "Facturacion",
  movimientos: "Movimientos",
  reportes: "Reportes",
  proyectos: "Proyectos",
  suscripciones: "Suscripciones"
};

export function bindDom() {
  document.querySelectorAll("[id]").forEach((node) => {
    dom[node.id] = node;
  });
}

export function renderAuth() {
  const authenticated = isAuthenticated();
  dom.authShell.hidden = authenticated;
  dom.appShell.hidden = !authenticated;

  if (!authenticated) {
    dom.registerPanel.hidden = hasUsers();
    dom.loginPanel.hidden = !hasUsers();
    return;
  }

  const user = currentUser();
  dom.sessionUser.textContent = user.email;
  dom.sessionRole.textContent = user.role.replace("_", " ");
  document.body.classList.toggle("read-only", !canWrite());
}

export function renderAll() {
  renderAuth();
  if (!isAuthenticated()) return;
  syncControls();
  renderBankingHero();
  renderStats();
  renderDashboardLists();
  renderClients();
  renderProjects();
  renderInvoices();
  renderPayments();
  renderMovements();
  renderSubscriptions();
  renderReports();
  drawAllCharts();
}

export function renderView(view) {
  if (!isAuthenticated()) {
    renderAuth();
    return;
  }
  state.activeView = view;
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === view));
  dom.pageTitle.textContent = titles[view] || "Dashboard financiero";
  closeMobileMenu();
  drawAllCharts();
}

export function syncControls() {
  populateClientSelects();
  populateProjectSelects();
  dom.exchangeRate.value = state.exchangeRate;
}

function renderBankingHero() {
  const month = totalsForMonth();
  const totals = globalTotals();
  dom.heroBalance.textContent = formatARS(totals.balanceARS);
  dom.heroArs.textContent = formatMoney(totals.ars, "ARS");
  dom.heroUsd.textContent = formatMoney(totals.usd, "USD");
  dom.heroRate.textContent = formatARS(state.exchangeRate);
  dom.heroForecast.textContent = formatARS(month.estimated);
  dom.heroProfit.textContent = formatARS(month.profit);
  dom.heroProfit.className = month.profit >= 0 ? "amount-positive" : "amount-negative";
}

function renderStats() {
  const month = totalsForMonth();
  const totals = globalTotals();
  const billing = billingTotals();
  const cards = [
    ["Saldo total", formatARS(totals.balanceARS), "Consolidado con cotizacion actual", "green"],
    ["Ingresos del mes", formatARS(month.income), "Cobros + ingresos", "blue"],
    ["Gastos del mes", formatARS(month.expenses), "Salidas registradas", "coral"],
    ["Estimado del mes", formatARS(month.estimated), "Ingresos + pendientes - gastos", ""],
    ["Facturado", formatARS(billing.facturado), "Facturacion global filtrable", "blue"],
    ["Pendiente", formatARS(billing.pendiente), "Por cobrar", "coral"],
    ["Proyectos activos", projects().filter((project) => !["entregado", "pausado", "cancelado"].includes(project.status)).length.toString(), "Delivery en curso", "green"],
    ["Clientes", clients().length.toString(), "Cartera visible", ""]
  ];

  dom.statsGrid.innerHTML = cards.map(([label, value, hint, tone]) => `
    <article class="stat-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${hint}</small>
    </article>
  `).join("");
}

function renderDashboardLists() {
  const upcoming = upcomingPayments();
  dom.upcomingPayments.innerHTML = upcoming.length ? upcoming.map((invoice) => {
    const client = getClient(invoice.clientId);
    return `
      <article class="list-item">
        <div>
          <strong>${escapeHTML(client?.company || "Cliente eliminado")}</strong>
          <span>Vence ${formatDate(invoice.dueDate)} - ${escapeHTML(invoice.number)}</span>
        </div>
        <div>
          <strong class="${normalizedInvoiceStatus(invoice) === "vencida" ? "amount-negative" : "amount-neutral"}">${formatMoney(invoice.amount, invoice.currency)}</strong>
          <span class="badge ${normalizedInvoiceStatus(invoice)}">${normalizedInvoiceStatus(invoice)}</span>
        </div>
      </article>
    `;
  }).join("") : emptyState("No hay facturas proximas a vencer.");

  const summaries = billingSummaryByClient().filter((summary) => summary.totalPendiente > 0);
  dom.debtClientsTable.innerHTML = summaries.length ? summaries.map((summary) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(summary.client.name)}</strong><span>${escapeHTML(summary.client.company)}</span></div></td>
      <td>${escapeHTML(summary.client.service)}</td>
      <td>${formatARS(summary.totalPendiente)}</td>
      <td><span class="badge ${summary.totalVencido > 0 ? "vencida" : "pendiente"}">${summary.status}</span></td>
    </tr>
  `).join("") : tableEmpty(4, "No hay clientes con deuda.");

  const recent = getActivityRows().slice(0, 5);
  dom.recentActivity.innerHTML = recent.length ? recent.map((item) => `
    <article class="list-item">
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <span>${formatDate(item.date)} - ${escapeHTML(item.detail)}</span>
      </div>
      <strong class="${item.type === "salida" ? "amount-negative" : "amount-positive"}">${item.sign}${formatMoney(item.amount, item.currency)}</strong>
    </article>
  `).join("") : emptyState("Todavia no hay movimientos.");
}

function renderClients() {
  const rows = clients();
  dom.clientsTable.innerHTML = rows.length ? rows.map((client) => {
    const clientProjects = projects().filter((project) => project.clientId === client.id);
    const summary = billingSummaryByClient({ ...state.billingFilters, clientId: client.id, projectId: "" })[0];
    return `
      <tr>
        <td><div class="entity-title"><strong>${escapeHTML(client.name)}</strong><span>${escapeHTML(client.company)} - ${escapeHTML(client.email)}</span></div></td>
        <td>${escapeHTML(client.service)}</td>
        <td>${formatMoney(client.amount, client.currency)}</td>
        <td><span class="badge ${client.status}">${client.status}</span></td>
        <td>
          <div class="actions-cell">
            <button class="ghost-button compact" type="button" onclick="showClientDetail('${client.id}')">Detalle</button>
            <button class="ghost-button compact write-action" type="button" onclick="editClient('${client.id}')">Editar</button>
            <button class="danger-button compact delete-action" type="button" onclick="deleteClient('${client.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
      <tr class="client-detail-row ${state.selectedClientId === client.id ? "show" : ""}">
        <td colspan="5">
          <div class="detail-panel">
            <strong>Proyectos asociados</strong>
            <p>${clientProjects.length ? clientProjects.map((project) => escapeHTML(project.name)).join(", ") : "Sin proyectos asociados."}</p>
            <strong>Facturacion</strong>
            <p>Facturado: ${formatARS(summary?.totalFacturado || 0)} · Pendiente: ${formatARS(summary?.totalPendiente || 0)}</p>
          </div>
        </td>
      </tr>
    `;
  }).join("") : tableEmpty(5, "No hay clientes registrados.");
}

function renderProjects() {
  const availableClients = clients();
  const filtered = state.projectFilterClientId ? projects().filter((project) => project.clientId === state.projectFilterClientId) : projects();

  dom.projectEmptyState.hidden = availableClients.length > 0;
  dom.projectForm.hidden = availableClients.length === 0;

  dom.projectsTable.innerHTML = filtered.length ? filtered.map((project) => {
    const client = getClient(project.clientId);
    return `
      <tr>
        <td><div class="entity-title"><strong>${escapeHTML(project.name)}</strong><span>${escapeHTML(project.description || "")}</span></div></td>
        <td>${escapeHTML(client?.company || "Cliente eliminado")}</td>
        <td>${formatMoney(project.budget, project.currency)}</td>
        <td><div class="progress-cell"><span>${project.progress}%</span><div class="progress-bar"><i style="width:${Math.min(Math.max(project.progress, 0), 100)}%"></i></div></div></td>
        <td>${project.dueDate ? formatDate(project.dueDate) : "Sin fecha"}</td>
        <td><span class="badge ${project.status}">${project.status.replace("_", " ")}</span></td>
        <td>
          <div class="actions-cell">
            <button class="ghost-button compact write-action" type="button" onclick="editProject('${project.id}')">Editar</button>
            <button class="danger-button compact delete-action" type="button" onclick="deleteProject('${project.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("") : tableEmpty(7, availableClients.length ? "No hay proyectos para este filtro." : "Primero tenes que crear un cliente para poder crear un proyecto.");
}

function renderInvoices() {
  const summaries = billingSummaryByClient();
  const totals = billingTotals();
  dom.billingTotals.innerHTML = `
    <article class="stat-card blue"><span>Total facturado</span><strong>${formatARS(totals.facturado)}</strong><small>${totals.facturas} facturas</small></article>
    <article class="stat-card green"><span>Total cobrado</span><strong>${formatARS(totals.cobrado)}</strong><small>Cobros aplicados</small></article>
    <article class="stat-card coral"><span>Total pendiente</span><strong>${formatARS(totals.pendiente)}</strong><small>Por cobrar</small></article>
    <article class="stat-card coral"><span>Total vencido</span><strong>${formatARS(totals.vencido)}</strong><small>Requiere seguimiento</small></article>
  `;

  dom.billingClientCards.innerHTML = summaries.length ? summaries.map((summary) => {
    const projectNames = [...new Set(summary.invoices.map((invoice) => getProject(invoice.projectId)?.name).filter(Boolean))];
    return `
      <article class="billing-card">
        <button class="billing-card-main" type="button" onclick="toggleBillingDetail('${summary.client.id}')">
          <div>
            <span>Cliente</span>
            <strong>${escapeHTML(summary.client.company)}</strong>
            <small>${escapeHTML(projectNames.join(", ") || "Sin proyectos asociados")}</small>
          </div>
          <div><span>Facturado</span><strong>${formatARS(summary.totalFacturado)}</strong></div>
          <div><span>Cobrado</span><strong class="amount-positive">${formatARS(summary.totalCobrado)}</strong></div>
          <div><span>Pendiente</span><strong class="amount-negative">${formatARS(summary.totalPendiente)}</strong></div>
          <span class="badge ${summary.totalVencido > 0 ? "vencida" : summary.totalPendiente > 0 ? "pendiente" : "pagada"}">${summary.status}</span>
        </button>
        <div class="billing-detail ${state.selectedBillingClientId === summary.client.id ? "show" : ""}">
          <p>${summary.invoiceCount} facturas · ${summary.projectCount} proyectos · Ultimo pago: ${summary.lastPayment ? formatDate(summary.lastPayment.date) : "Sin pagos"} · Proximo vencimiento: ${summary.nextDue ? formatDate(summary.nextDue.dueDate) : "Sin vencimientos"}</p>
          <div class="table-wrap mini-table">
            <table>
              <thead><tr><th>Factura</th><th>Proyecto</th><th>Monto</th><th>Cobrado</th><th>Vence</th><th>Estado</th></tr></thead>
              <tbody>
                ${summary.invoices.map((invoice) => `
                  <tr>
                    <td>${escapeHTML(invoice.number)}</td>
                    <td>${escapeHTML(getProject(invoice.projectId)?.name || "General")}</td>
                    <td>${formatMoney(invoice.amount, invoice.currency)}</td>
                    <td>${formatARS(paidForInvoice(invoice.id))}</td>
                    <td>${formatDate(invoice.dueDate)}</td>
                    <td><span class="badge ${normalizedInvoiceStatus(invoice)}">${normalizedInvoiceStatus(invoice)}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    `;
  }).join("") : emptyState("No hay facturacion para los filtros actuales.");

  const invoiceRows = filteredInvoices();
  dom.invoicesTable.innerHTML = invoiceRows.length ? invoiceRows.map((invoice) => `
    <tr>
      <td>${escapeHTML(invoice.number)}</td>
      <td>${escapeHTML(getClient(invoice.clientId)?.company || "Cliente eliminado")}</td>
      <td>${escapeHTML(getProject(invoice.projectId)?.name || "General")}</td>
      <td>${formatMoney(invoice.amount, invoice.currency)}</td>
      <td>${formatDate(invoice.dueDate)}</td>
      <td><span class="badge ${normalizedInvoiceStatus(invoice)}">${normalizedInvoiceStatus(invoice)}</span></td>
      <td>
        <div class="actions-cell">
          <button class="ghost-button compact write-action" type="button" onclick="editInvoice('${invoice.id}')">Editar</button>
          <button class="danger-button compact delete-action" type="button" onclick="deleteInvoice('${invoice.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("") : tableEmpty(7, "No hay facturas con los filtros actuales.");
}

function renderPayments() {
  const rows = payments().sort((a, b) => parseDate(b.date) - parseDate(a.date));
  dom.paymentsTable.innerHTML = rows.length ? rows.map((payment) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(getClient(payment.clientId)?.company || "Cliente eliminado")}</strong><span>${escapeHTML(getInvoice(payment.invoiceId)?.number || "Sin factura")}</span></div></td>
      <td>${formatMoney(payment.amount, payment.currency)}</td>
      <td>${formatDate(payment.date)}</td>
      <td>${payment.dueDate ? formatDate(payment.dueDate) : "-"}</td>
      <td><span class="badge ${payment.status}">${payment.status}</span></td>
      <td>
        <div class="actions-cell">
          <button class="ghost-button compact write-action" type="button" onclick="editPayment('${payment.id}')">Editar</button>
          <button class="danger-button compact delete-action" type="button" onclick="deletePayment('${payment.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("") : tableEmpty(6, "No hay pagos registrados.");
}

function renderMovements() {
  const rows = movements().sort((a, b) => parseDate(b.date) - parseDate(a.date));
  dom.movementsTable.innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td><span class="badge ${item.type}">${item.type}</span></td>
      <td>${escapeHTML(item.category)}</td>
      <td class="${item.type === "salida" ? "amount-negative" : "amount-positive"}">${item.type === "salida" ? "-" : "+"}${formatMoney(item.amount, item.currency)}</td>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHTML(item.description)}</td>
      <td>
        <div class="actions-cell">
          <button class="ghost-button compact write-action" type="button" onclick="editMovement('${item.id}')">Editar</button>
          <button class="danger-button compact delete-action" type="button" onclick="deleteMovement('${item.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("") : tableEmpty(6, "No hay movimientos registrados.");
}

function renderSubscriptions() {
  const rows = subscriptions().sort((a, b) => parseDate(a.renewalDate) - parseDate(b.renewalDate));
  dom.subscriptionsTable.innerHTML = rows.length ? rows.map((subscription) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(subscription.name)}</strong><span>${escapeHTML(subscription.category)}</span></div></td>
      <td>${escapeHTML(subscription.provider)}</td>
      <td>${formatMoney(subscription.monthlyCost, subscription.currency)}</td>
      <td>${formatMoney(subscription.annualCost, subscription.currency)}</td>
      <td>${formatDate(subscription.renewalDate)}</td>
      <td><span class="badge ${subscription.status}">${subscription.status.replace("_", " ")}</span></td>
      <td>
        <div class="actions-cell">
          <button class="ghost-button compact write-action" type="button" onclick="editSubscription('${subscription.id}')">Editar</button>
          <button class="danger-button compact delete-action" type="button" onclick="deleteSubscription('${subscription.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("") : tableEmpty(7, "No hay suscripciones registradas.");
}

function renderReports() {
  const rows = getActivityRows().filter(matchesReportFilters);
  dom.reportsTable.innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHTML(item.origin)}</td>
      <td>${escapeHTML(item.title)}</td>
      <td class="${item.type === "salida" ? "amount-negative" : "amount-positive"}">${item.sign}${formatMoney(item.amount, item.currency)}</td>
      <td>${formatDate(item.date)}</td>
      <td>${item.status ? `<span class="badge ${item.status}">${item.status}</span>` : `<span class="badge ${item.type}">${item.type}</span>`}</td>
      <td>${escapeHTML(item.detail)}</td>
    </tr>
  `).join("") : tableEmpty(6, "No hay resultados con los filtros actuales.");
}

function populateClientSelects() {
  const options = [`<option value="">Todos</option>`].concat(clients().map((client) => `<option value="${client.id}">${escapeHTML(client.company)} - ${escapeHTML(client.name)}</option>`));
  const requiredOptions = clients().map((client) => `<option value="${client.id}">${escapeHTML(client.company)} - ${escapeHTML(client.name)}</option>`).join("");

  ["filterClient", "billingFilterClient", "projectFilterClient"].forEach((id) => {
    if (dom[id]) dom[id].innerHTML = options.join("");
  });

  ["paymentClient", "projectClient", "invoiceClient"].forEach((id) => {
    if (dom[id]) dom[id].innerHTML = requiredOptions || `<option value="">Crea un cliente primero</option>`;
  });

  if (dom.billingFilterClient) dom.billingFilterClient.value = state.billingFilters.clientId;
  if (dom.projectFilterClient) dom.projectFilterClient.value = state.projectFilterClientId;
}

function populateProjectSelects() {
  const billingClientId = state.billingFilters.clientId;
  const projectList = billingClientId ? projects().filter((project) => project.clientId === billingClientId) : projects();
  const billingOptions = [`<option value="">Todos</option>`].concat(projectList.map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`));
  if (dom.billingFilterProject) {
    dom.billingFilterProject.innerHTML = billingOptions.join("");
    dom.billingFilterProject.value = state.billingFilters.projectId;
  }

  const invoiceClientId = dom.invoiceClient?.value;
  const invoiceProjects = invoiceClientId ? projects().filter((project) => project.clientId === invoiceClientId) : projects();
  if (dom.invoiceProject) {
    dom.invoiceProject.innerHTML = [`<option value="">General del cliente</option>`].concat(invoiceProjects.map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`)).join("");
  }

  if (dom.paymentInvoice) {
    dom.paymentInvoice.innerHTML = [`<option value="">Sin factura</option>`].concat(filteredInvoices({}).map((invoice) => `<option value="${invoice.id}">${escapeHTML(invoice.number)} - ${escapeHTML(getClient(invoice.clientId)?.company || "")}</option>`)).join("");
  }

  if (dom.paymentProject) {
    dom.paymentProject.innerHTML = [`<option value="">Sin proyecto</option>`].concat(projects().map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`)).join("");
  }
}

export function resetPaymentForm() {
  dom.paymentForm.reset();
  dom.paymentId.value = "";
  dom.paymentDate.value = toInputDate(new Date());
  dom.paymentDueDate.value = toInputDate(new Date(Date.now() + 7 * DAY_MS));
  dom.paymentFormTitle.textContent = "Registrar pago";
}

export function resetProjectForm() {
  dom.projectForm.reset();
  dom.projectId.value = "";
  dom.projectProgress.value = 0;
  dom.projectDueDate.value = toInputDate(new Date(Date.now() + 21 * DAY_MS));
  dom.projectStartDate.value = toInputDate(new Date());
  dom.projectFormTitle.textContent = "Crear proyecto";
}

export function resetInvoiceForm() {
  dom.invoiceForm.reset();
  dom.invoiceId.value = "";
  dom.invoiceIssueDate.value = toInputDate(new Date());
  dom.invoiceDueDate.value = toInputDate(new Date(Date.now() + 10 * DAY_MS));
  dom.invoiceFormTitle.textContent = "Crear factura";
  populateProjectSelects();
}

export function resetMovementForm() {
  dom.movementForm.reset();
  dom.movementId.value = "";
  dom.movementDate.value = toInputDate(new Date());
  dom.movementFormTitle.textContent = "Registrar movimiento";
}

export function resetSubscriptionForm() {
  dom.subscriptionForm.reset();
  dom.subscriptionId.value = "";
  dom.subscriptionRenewal.value = toInputDate(new Date(Date.now() + 30 * DAY_MS));
  dom.subscriptionFormTitle.textContent = "Nueva suscripcion";
}

export function closeMobileMenu() {
  dom.sidebar.classList.remove("open");
  dom.mobileBackdrop.classList.remove("show");
}

export function openMobileMenu() {
  dom.sidebar.classList.add("open");
  dom.mobileBackdrop.classList.add("show");
}

function getActivityRows() {
  const paymentRows = payments().map((payment) => ({
    origin: "Pago",
    title: getClient(payment.clientId)?.company || "Cliente eliminado",
    detail: payment.notes || payment.method,
    amount: payment.amount,
    currency: payment.currency,
    date: payment.date,
    type: "ingreso",
    sign: "+",
    status: payment.status,
    clientId: payment.clientId
  }));

  const movementRows = movements().map((item) => ({
    origin: item.type === "ingreso" ? "Ingreso" : "Salida",
    title: item.category,
    detail: item.description,
    amount: item.amount,
    currency: item.currency,
    date: item.date,
    type: item.type,
    sign: item.type === "salida" ? "-" : "+",
    status: "",
    clientId: ""
  }));

  return paymentRows.concat(movementRows).sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

function matchesReportFilters(item) {
  const itemDate = parseDate(item.date);
  if (state.filters.from && itemDate < parseDate(state.filters.from)) return false;
  if (state.filters.to && itemDate > parseDate(state.filters.to)) return false;
  if (state.filters.clientId && item.clientId !== state.filters.clientId) return false;
  if (state.filters.currency && item.currency !== state.filters.currency) return false;
  if (state.filters.status && item.status !== state.filters.status) return false;
  return true;
}

function drawAllCharts() {
  drawBarChart(dom.monthlyChart, monthlySeries());
  drawLineChart(dom.balanceChart, monthlySeries());
  drawMiniChart(dom.miniFlowChart, monthlySeries());
}

function monthlySeries() {
  return Array.from({ length: 6 }, (_, index) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthPayments = payments().filter((payment) => {
      const paymentDate = parseDate(payment.date);
      return payment.status === "pagado" && paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
    });
    const monthMovements = movements().filter((movement) => {
      const movementDate = parseDate(movement.date);
      return movementDate.getMonth() === month && movementDate.getFullYear() === year;
    });
    const income = monthPayments.reduce((total, payment) => total + payment.amount, 0)
      + monthMovements.filter((item) => item.type === "ingreso").reduce((total, item) => total + item.amount, 0);
    const expenses = monthMovements.filter((item) => item.type === "salida").reduce((total, item) => total + item.amount, 0);
    return { label: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date), income, expenses, balance: income - expenses };
  });
}

function setupCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function drawBarChart(canvas, rows) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, width, height } = setup;
  const max = Math.max(...rows.flatMap((row) => [row.income, row.expenses]), 1);
  const chartHeight = height - 54;
  const slot = width / rows.length;
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  rows.forEach((row, index) => {
    const x = index * slot + slot * 0.22;
    roundRect(ctx, x, height - (row.income / max) * chartHeight - 28, slot * 0.22, (row.income / max) * chartHeight, 8, "#9f5cff");
    roundRect(ctx, x + slot * 0.28, height - (row.expenses / max) * chartHeight - 28, slot * 0.22, (row.expenses / max) * chartHeight, 8, "#ff7a59");
    ctx.fillStyle = "#a9a7ba";
    ctx.font = "12px Inter";
    ctx.fillText(row.label, x - 4, height - 8);
  });
}

function drawLineChart(canvas, rows) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, width, height } = setup;
  const max = Math.max(...rows.map((row) => row.balance), 1);
  const min = Math.min(...rows.map((row) => row.balance), 0);
  const range = Math.max(max - min, 1);
  const chartHeight = height - 54;
  const points = rows.map((row, index) => ({
    x: 22 + index * ((width - 44) / Math.max(rows.length - 1, 1)),
    y: 18 + chartHeight - ((row.balance - min) / range) * chartHeight,
    label: row.label
  }));
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  ctx.beginPath();
  points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = "#9f5cff";
  ctx.lineWidth = 3;
  ctx.stroke();
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ff7a59";
    ctx.fill();
    ctx.fillStyle = "#a9a7ba";
    ctx.font = "12px Inter";
    ctx.fillText(point.label, point.x - 16, height - 8);
  });
}

function drawMiniChart(canvas, rows) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, width, height } = setup;
  const totalIncome = rows.reduce((total, row) => total + row.income, 0);
  const totalExpenses = rows.reduce((total, row) => total + row.expenses, 0);
  const max = Math.max(totalIncome, totalExpenses, 1);
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  roundRect(ctx, 34, 54, (width - 80) * (totalIncome / max), 42, 16, "#9f5cff");
  roundRect(ctx, 34, 126, (width - 80) * (totalExpenses / max), 42, 16, "#ff7a59");
  ctx.fillStyle = "#f7f5ff";
  ctx.font = "700 14px Inter";
  ctx.fillText("Ingresos", 34, 42);
  ctx.fillText("Egresos", 34, 114);
  ctx.fillStyle = "#a9a7ba";
  ctx.font = "13px Inter";
  ctx.fillText(formatARS(totalIncome), 44, 82);
  ctx.fillText(formatARS(totalExpenses), 44, 154);
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  for (let y = 24; y < height - 24; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, width, height, radius, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(width, 4), Math.max(height, 4), radius);
  ctx.fillStyle = color;
  ctx.fill();
}

export function getClient(id) {
  return clients().find((client) => client.id === id);
}

export function getProject(id) {
  return projects().find((project) => project.id === id);
}

export function getInvoice(id) {
  return invoices().find((invoice) => invoice.id === id);
}

export function formatMoney(amount, currency) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "ARS" ? 0 : 2
  }).format(Number(amount));
}

export function formatARS(amount) {
  return formatMoney(amount, "ARS");
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(parseDate(date));
}

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

export function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}

export function tableEmpty(columns, message) {
  return `<tr><td colspan="${columns}"><div class="empty-state">${message}</div></td></tr>`;
}

export function notify(title, message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
  dom.toastRegion.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}
