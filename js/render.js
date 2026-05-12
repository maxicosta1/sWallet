import { canDelete, canWrite, currentUser, hasUsers, isAuthenticated } from "./auth.js";
import {
  actions,
  billingSummaryByClient,
  billingTotals,
  clientAdminSummary,
  clientHealth,
  clients,
  companyProgress,
  filteredInvoices,
  globalTotals,
  goalProgressPercent,
  goals,
  invoiceAmountARS,
  movements,
  notifications,
  normalizedInvoiceStatus,
  notes,
  paidForInvoice,
  payments,
  projectFinancials,
  projects,
  requests,
  searchResults,
  subscriptions,
  tasks,
  totalsForMonth,
  upcomingPayments
} from "./finance.js";
import { parseDate, state, toInputDate, DAY_MS } from "./state.js";

export const dom = {};

const titles = {
  dashboard: "Dashboard financiero",
  clientes: "Clientes",
  proyectos: "Proyectos",
  finanzas: "Finanzas",
  pagos: "Pagos",
  facturacion: "Facturacion",
  administracion: "Administracion",
  tareas: "Tareas",
  metas: "Metas",
  movimientos: "Movimientos",
  reportes: "Reportes",
  suscripciones: "Suscripciones",
  configuracion: "Configuracion"
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
  renderGlobalSearch();
  renderNotifications();
  renderDashboardCalendar();
  renderClients();
  renderClientKanban();
  renderProjects();
  renderFinance();
  renderInvoices();
  renderPayments();
  renderMovements();
  renderSubscriptions();
  renderAdministration();
  renderTasks();
  renderGoals();
  renderSettings();
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
  const now = new Date();
  dom.heroBalance.textContent = formatARS(totals.balanceARS);
  dom.heroArs.textContent = formatMoney(totals.ars, "ARS");
  dom.heroUsd.textContent = formatMoney(totals.usd, "USD");
  dom.heroRate.textContent = formatARS(state.exchangeRate);
  dom.heroForecast.textContent = formatARS(month.estimated);
  dom.heroProfit.textContent = formatARS(month.profit);
  dom.heroProfit.className = month.profit >= 0 ? "amount-positive" : "amount-negative";
  if (dom.dashboardDateRange) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    dom.dashboardDateRange.textContent = `${formatDate(start)} - ${formatDate(end)}`;
  }
}

function renderStats() {
  const month = totalsForMonth();
  const totals = globalTotals();
  const billing = billingTotals();
  const pendingTasks = tasks().filter((task) => !["completada", "cancelada"].includes(task.status)).length;
  const activeProjects = projects().filter((project) => !["finalizado", "entregado", "cancelado"].includes(project.status)).length;
  const overdue = filteredInvoices({ clientId: "", projectId: "", status: "vencida", currency: "", from: "", to: "", quick: "" }).length;
  const progress = companyProgress();
  const cards = [
    ["Saldo total", formatARS(totals.balanceARS), "Consolidado con cotizacion actual", "green"],
    ["Ingresos del mes", formatARS(month.income), "Cobros + ingresos", "blue"],
    ["Gastos del mes", formatARS(month.expenses), "Salidas registradas", "coral"],
    ["Estimado del mes", formatARS(month.estimated), "Ingresos + pendientes - gastos", ""],
    ["Facturado", formatARS(billing.facturado), "Facturacion global filtrable", "blue"],
    ["Pendiente", formatARS(billing.pendiente), "Por cobrar", "coral"],
    ["Proyectos activos", activeProjects.toString(), "Delivery en curso", "green"],
    ["Tareas pendientes", pendingTasks.toString(), "Trabajo interno abierto", ""],
    ["Pagos vencidos", overdue.toString(), "Requieren seguimiento", "coral"],
    ["Metas", `${progress}%`, "Progreso general sCode", "blue"],
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

  if (dom.companyProgressWidget) {
    const progress = companyProgress();
    dom.companyProgressWidget.innerHTML = `
      <div class="progress-hero">
        <strong>${progress}%</strong>
        <span>Promedio entre cobranza, delivery y metas.</span>
        <div class="progress-bar"><i style="width:${progress}%"></i></div>
      </div>
    `;
  }
}

function renderNotifications() {
  if (!dom.notificationsList) return;
  const rows = notifications();
  dom.notificationsList.innerHTML = rows.length ? rows.map((item) => `
    <article class="list-item alert-item ${item.tone}">
      <div>
        <strong>${escapeHTML(item.type)} - ${escapeHTML(item.title)}</strong>
        <span>${escapeHTML(item.detail)} - ${formatDate(item.date)}</span>
      </div>
      <span class="badge ${item.tone}">${escapeHTML(item.tone)}</span>
    </article>
  `).join("") : emptyState("No hay alertas internas.");
}

function renderGlobalSearch() {
  if (!dom.globalSearch || !dom.globalSearchResults) return;
  dom.globalSearch.value = state.globalSearch;
  const rows = searchResults();
  dom.globalSearchResults.hidden = !state.globalSearch;
  dom.globalSearchResults.innerHTML = rows.length ? rows.map((item) => `
    <button type="button" onclick="goSearchResult('${item.view}')">
      <span>${escapeHTML(item.type)}</span>
      <strong>${escapeHTML(item.title)}</strong>
      <small>${escapeHTML(item.detail)}</small>
    </button>
  `).join("") : emptyState("Sin resultados.");
}

function renderDashboardCalendar() {
  if (!dom.financeCalendar) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const monthEvents = getCalendarEvents().filter((event) => {
    const date = parseDate(event.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  const days = Array.from({ length: startOffset + last.getDate() }, (_, index) => {
    const day = index - startOffset + 1;
    if (day < 1) return `<span class="calendar-day muted"></span>`;
    const date = new Date(year, month, day);
    const dateKey = toInputDate(date);
    const events = monthEvents.filter((event) => event.date === dateKey);
    const isToday = toInputDate(now) === dateKey;
    return `
      <button class="calendar-day ${isToday ? "today" : ""} ${events.length ? "has-event" : ""}" type="button" title="${events.map((event) => escapeHTML(event.title)).join(" / ")}">
        <span>${day}</span>
        ${events.length ? `<i>${events.length}</i>` : ""}
      </button>
    `;
  });

  dom.calendarMonthTitle.textContent = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(now);
  dom.financeCalendar.innerHTML = `
    <div class="calendar-weekdays"><span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span></div>
    <div class="calendar-days">${days.join("")}</div>
  `;

  const events = getCalendarEvents().slice(0, 5);
  const calendarUrl = "https://calendar.google.com/calendar/u/0/r";
  if (dom.googleCalendarMain) dom.googleCalendarMain.href = calendarUrl;
  if (dom.googleCalendarSecondary) dom.googleCalendarSecondary.href = calendarUrl;
  dom.googleCalendarList.innerHTML = events.length ? events.map((event) => `
    <article class="calendar-sync-item">
      <div>
        <strong>${escapeHTML(event.title)}</strong>
        <span>${formatDate(event.date)} - ${escapeHTML(event.detail)}</span>
      </div>
      <a class="ghost-button compact" href="${googleCalendarUrl(event)}" target="_blank" rel="noopener">Agregar</a>
    </article>
  `).join("") : emptyState("Sin vencimientos para vincular.");
}

function renderClients() {
  const rows = clients();
  dom.clientsTable.innerHTML = rows.length ? rows.map((client) => {
    const clientProjects = projects().filter((project) => project.clientId === client.id);
    const clientTasks = tasks().filter((task) => task.clientId === client.id);
    const health = clientHealth(client.id);
    const summary = billingSummaryByClient({ ...state.billingFilters, clientId: client.id, projectId: "" })[0];
    return `
      <tr>
        <td><div class="entity-title"><strong>${escapeHTML(client.name)}</strong><span>${escapeHTML(client.company)} - ${escapeHTML(client.email)}</span></div></td>
        <td>${escapeHTML(client.service)}</td>
        <td>${formatMoney(client.amount, client.currency)}</td>
        <td><span class="badge ${client.status}">${labelize(client.status)}</span><span class="health-pill ${health.tone}">${health.label}</span></td>
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
            <div class="detail-grid">
              <span><strong>Prioridad</strong>${labelize(client.priority || "media")}</span>
              <span><strong>Ultimo contacto</strong>${client.lastContact ? formatDate(client.lastContact) : "Sin dato"}</span>
              <span><strong>Web</strong>${escapeHTML(client.website || "Sin web")}</span>
              <span><strong>Redes</strong>${escapeHTML(client.socials || "Sin dato")}</span>
            </div>
            <strong>Proyectos asociados</strong>
            <p>${clientProjects.length ? clientProjects.map((project) => escapeHTML(project.name)).join(", ") : "Sin proyectos asociados."}</p>
            <strong>Tareas asociadas</strong>
            <p>${clientTasks.length ? clientTasks.map((task) => escapeHTML(task.title)).join(", ") : "Sin tareas asociadas."}</p>
            <strong>Facturacion</strong>
            <p>Facturado: ${formatARS(summary?.totalFacturado || 0)} - Cobrado: ${formatARS(summary?.totalCobrado || 0)} - Pendiente: ${formatARS(summary?.totalPendiente || 0)}</p>
            <strong>Notas internas</strong>
            <p>${escapeHTML(client.observations || "Sin notas.")}</p>
          </div>
        </td>
      </tr>
    `;
  }).join("") : tableEmpty(5, "No hay clientes registrados.");
}

function renderClientKanban() {
  if (!dom.clientKanban) return;
  const statuses = ["lead", "contactado", "presupuesto_enviado", "en_negociacion", "cliente_activo", "esperando_respuesta", "proyecto_finalizado", "perdido"];
  dom.clientKanban.innerHTML = statuses.map((status) => {
    const rows = clients().filter((client) => normalizeClientStatus(client.status) === status);
    return `
      <article class="kanban-column">
        <h3>${labelize(status)} <span>${rows.length}</span></h3>
        <div class="kanban-cards">
          ${rows.length ? rows.map((client) => {
            const health = clientHealth(client.id);
            return `
              <button class="kanban-card" type="button" onclick="showClientDetail('${client.id}')">
                <strong>${escapeHTML(client.company)}</strong>
                <span>${escapeHTML(client.service || client.name)}</span>
                <small class="health-pill ${health.tone}">${health.label}</small>
              </button>
            `;
          }).join("") : `<div class="kanban-empty">Sin clientes</div>`}
        </div>
      </article>
    `;
  }).join("");
}

function renderProjects() {
  const availableClients = clients();
  const filtered = state.projectFilterClientId ? projects().filter((project) => project.clientId === state.projectFilterClientId) : projects();

  dom.projectEmptyState.hidden = availableClients.length > 0;
  dom.projectForm.hidden = availableClients.length === 0;

  dom.projectsTable.innerHTML = filtered.length ? filtered.map((project) => {
    const client = getClient(project.clientId);
    const financials = projectFinancials(project.id);
    return `
      <tr>
        <td><div class="entity-title"><strong>${escapeHTML(project.name)}</strong><span>${escapeHTML(project.description || "")}</span><small>${escapeHTML(project.responsible || "Sin responsable")} - ${escapeHTML(project.technologies || "Sin tecnologias")}</small></div></td>
        <td>${escapeHTML(client?.company || "Cliente eliminado")}</td>
        <td>${formatMoney(project.budget, project.currency)}</td>
        <td class="${financials.profit >= 0 ? "amount-positive" : "amount-negative"}">${formatARS(financials.profit)}</td>
        <td><div class="progress-cell"><span>${project.progress}%</span><div class="progress-bar"><i style="width:${Math.min(Math.max(project.progress, 0), 100)}%"></i></div></div></td>
        <td>${project.dueDate ? formatDate(project.dueDate) : "Sin fecha"}</td>
        <td><span class="badge ${project.status}">${labelize(project.status)}</span></td>
        <td>
          <div class="actions-cell">
            <button class="ghost-button compact write-action" type="button" onclick="editProject('${project.id}')">Editar</button>
            <button class="danger-button compact delete-action" type="button" onclick="deleteProject('${project.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("") : tableEmpty(8, availableClients.length ? "No hay proyectos para este filtro." : "Primero tenes que crear un cliente para poder crear un proyecto.");
}

function renderFinance() {
  if (!dom.financeStats) return;
  const totals = globalTotals();
  const month = totalsForMonth();
  const billing = billingTotals();
  dom.financeStats.innerHTML = `
    <article class="stat-card green"><span>Caja total</span><strong>${formatARS(totals.balanceARS)}</strong><small>ARS + USD convertido</small></article>
    <article class="stat-card blue"><span>Caja ARS</span><strong>${formatMoney(totals.ars, "ARS")}</strong><small>Moneda original</small></article>
    <article class="stat-card blue"><span>Caja USD</span><strong>${formatMoney(totals.usd, "USD")}</strong><small>Moneda original</small></article>
    <article class="stat-card coral"><span>Deuda total</span><strong>${formatARS(billing.pendiente)}</strong><small>Facturacion pendiente</small></article>
  `;
  dom.financeSummary.innerHTML = [
    ["Ingresos del mes", formatARS(month.income), "Cobros y entradas"],
    ["Gastos del mes", formatARS(month.expenses), "Salidas operativas"],
    ["Ganancia neta", formatARS(month.profit), "Resultado real"],
    ["Estimado", formatARS(month.estimated), "Incluye pendientes"]
  ].map(([title, value, detail]) => `<article class="list-item"><div><strong>${title}</strong><span>${detail}</span></div><strong>${value}</strong></article>`).join("");
  const profitable = projects().map((project) => ({ project, financials: projectFinancials(project.id) })).sort((a, b) => b.financials.profit - a.financials.profit).slice(0, 6);
  dom.profitProjects.innerHTML = profitable.length ? profitable.map(({ project, financials }) => `
    <article class="list-item">
      <div><strong>${escapeHTML(project.name)}</strong><span>${escapeHTML(getClient(project.clientId)?.company || "Sin cliente")}</span></div>
      <strong class="${financials.profit >= 0 ? "amount-positive" : "amount-negative"}">${formatARS(financials.profit)}</strong>
    </article>
  `).join("") : emptyState("Sin proyectos para analizar.");
}

function renderAdministration() {
  if (!dom.adminClientSummaries) return;
  const selected = state.adminFilterClientId;
  const summaries = clients().filter((client) => !selected || client.id === selected).map(clientAdminSummary);
  dom.adminClientSummaries.innerHTML = summaries.length ? summaries.map((item) => `
    <article class="admin-card">
      <div class="admin-card-head">
        <div><span>${escapeHTML(item.client.name)}</span><strong>${escapeHTML(item.client.company)}</strong></div>
        <span class="health-pill ${item.health.tone}">${item.health.label}</span>
      </div>
      <div class="admin-lines">
        <p><strong>Proyecto activo:</strong> ${escapeHTML(item.activeProject?.name || "Sin proyecto activo")}</p>
        <p><strong>Pidio:</strong> ${escapeHTML(item.asked)}</p>
        <p><strong>Falta hacer:</strong> ${item.pendingWork} tareas abiertas</p>
        <p><strong>Entregado:</strong> ${item.delivered} tareas completadas</p>
        <p><strong>Falta cobrar:</strong> ${formatARS(item.pendingMoney)}</p>
        <p><strong>Proxima accion:</strong> ${escapeHTML(item.nextAction)}</p>
      </div>
      <span class="badge ${item.priority}">${labelize(item.priority)}</span>
    </article>
  `).join("") : emptyState("Sin clientes para administrar.");

  const requestRows = requests().filter((request) => !selected || request.clientId === selected);
  dom.requestsTable.innerHTML = requestRows.length ? requestRows.sort((a, b) => parseDate(a.dueDate || a.date) - parseDate(b.dueDate || b.date)).map((request) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(request.description)}</strong><span>${labelize(request.type)} - ${escapeHTML(request.responsible || "")}</span></div></td>
      <td>${escapeHTML(getClient(request.clientId)?.company || "Sin cliente")}</td>
      <td><span class="badge ${request.priority}">${labelize(request.priority)}</span></td>
      <td><span class="badge ${request.status}">${labelize(request.status)}</span></td>
      <td>${request.dueDate ? formatDate(request.dueDate) : "-"}</td>
      <td><div class="actions-cell"><button class="ghost-button compact write-action" type="button" onclick="editRequest('${request.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteRequest('${request.id}')">Eliminar</button></div></td>
    </tr>
  `).join("") : tableEmpty(6, "Sin pedidos registrados.");

  dom.notesList.innerHTML = notes().filter((note) => !selected || note.clientId === selected).slice().sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 8).map((note) => `
    <article class="list-item"><div><strong>${escapeHTML(note.title)}</strong><span>${escapeHTML(getClient(note.clientId)?.company || "")} - ${escapeHTML(note.content)}</span></div><div class="actions-cell"><span class="badge ${note.tone}">${labelize(note.tone)}</span><button class="ghost-button compact write-action" type="button" onclick="editNote('${note.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteNote('${note.id}')">Eliminar</button></div></article>
  `).join("") || emptyState("Sin notas internas.");

  dom.actionsList.innerHTML = actions().filter((action) => !selected || action.clientId === selected).slice().sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate)).slice(0, 8).map((action) => `
    <article class="list-item"><div><strong>${escapeHTML(action.title)}</strong><span>${escapeHTML(getClient(action.clientId)?.company || "")} - ${formatDate(action.dueDate)}</span></div><div class="actions-cell"><span class="badge ${action.priority}">${labelize(action.status)}</span><button class="ghost-button compact write-action" type="button" onclick="editAction('${action.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteAction('${action.id}')">Eliminar</button></div></article>
  `).join("") || emptyState("Sin proximas acciones.");
}

function renderTasks() {
  if (!dom.tasksTable) return;
  const rows = tasks().filter((task) => !state.taskFilter || task.status === state.taskFilter);
  const statuses = ["pendiente", "en_proceso", "en_revision", "completada", "cancelada"];
  dom.taskBoard.innerHTML = statuses.map((status) => {
    const statusRows = rows.filter((task) => task.status === status);
    return `
      <article class="kanban-column">
        <h3>${labelize(status)} <span>${statusRows.length}</span></h3>
        <div class="kanban-cards">
          ${statusRows.length ? statusRows.map((task) => `
            <button class="kanban-card" type="button" onclick="editTask('${task.id}')">
              <strong>${escapeHTML(task.title)}</strong>
              <span>${escapeHTML(getClient(task.clientId)?.company || "Sin cliente")}</span>
              <small class="badge ${task.priority}">${labelize(task.priority)} - ${formatDate(task.dueDate)}</small>
            </button>
          `).join("") : `<div class="kanban-empty">Sin tareas</div>`}
        </div>
      </article>
    `;
  }).join("");
  dom.tasksTable.innerHTML = rows.length ? rows.map((task) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.responsible || "")}</span></div></td>
      <td>${escapeHTML(getClient(task.clientId)?.company || "Sin cliente")}</td>
      <td>${escapeHTML(getProject(task.projectId)?.name || "General")}</td>
      <td><span class="badge ${task.priority}">${labelize(task.priority)}</span></td>
      <td><span class="badge ${task.status}">${labelize(task.status)}</span></td>
      <td>${formatDate(task.dueDate)}</td>
      <td><div class="actions-cell"><button class="ghost-button compact write-action" type="button" onclick="editTask('${task.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteTask('${task.id}')">Eliminar</button></div></td>
    </tr>
  `).join("") : tableEmpty(7, "No hay tareas para este filtro.");
}

function renderGoals() {
  if (!dom.goalsGrid) return;
  dom.goalsGrid.innerHTML = goals().length ? goals().map((goal) => {
    const progress = goalProgressPercent(goal);
    const status = progress >= 100 ? "completada" : parseDate(goal.dueDate) < new Date() ? "vencida" : goal.status;
    return `
      <article class="goal-card">
        <div><span>${labelize(goal.period)} - ${labelize(goal.type)}</span><strong>${escapeHTML(goal.name)}</strong></div>
        <div class="progress-cell"><span>${progress}%</span><div class="progress-bar"><i style="width:${progress}%"></i></div></div>
        <p>${goal.current} / ${goal.target} - vence ${formatDate(goal.dueDate)}</p>
        <div class="actions-cell">
          <span class="badge ${status}">${labelize(status)}</span>
          <button class="ghost-button compact write-action" type="button" onclick="editGoal('${goal.id}')">Editar</button>
          <button class="danger-button compact delete-action" type="button" onclick="deleteGoal('${goal.id}')">Eliminar</button>
        </div>
      </article>
    `;
  }).join("") : emptyState("Sin metas cargadas.");
}

function renderSettings() {
  if (!dom.settingsSession) return;
  const user = currentUser();
  dom.settingsSession.innerHTML = `
    <article class="list-item"><div><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span></div><span class="badge ${user.role}">${labelize(user.role)}</span></article>
    <article class="list-item"><div><strong>Permisos</strong><span>${canWrite() ? "Puede crear y editar" : "Solo visualizacion"}</span></div><span class="badge ${canDelete() ? "admin" : "neutral"}">${canDelete() ? "admin" : "limitado"}</span></article>
  `;
  dom.settingsData.innerHTML = `
    <article class="list-item"><div><strong>Datos locales</strong><span>${clients().length} clientes, ${projects().length} proyectos, ${tasks().length} tareas</span></div><span class="badge saludable">localStorage</span></article>
    <article class="list-item"><div><strong>Cotizacion</strong><span>1 USD = ${formatARS(state.exchangeRate)}</span></div><span class="badge neutral">editable</span></article>
  `;
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
          <p>${summary.invoiceCount} facturas - ${summary.projectCount} proyectos - Ultimo pago: ${summary.lastPayment ? formatDate(summary.lastPayment.date) : "Sin pagos"} - Proximo vencimiento: ${summary.nextDue ? formatDate(summary.nextDue.dueDate) : "Sin vencimientos"}</p>
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

  ["filterClient", "billingFilterClient", "projectFilterClient", "adminClientFilter"].forEach((id) => {
    if (!dom[id]) return;
    const value = dom[id].value;
    dom[id].innerHTML = options.join("");
    if ([...dom[id].options].some((option) => option.value === value)) dom[id].value = value;
  });

  ["paymentClient", "projectClient", "invoiceClient", "taskClient", "requestClient", "noteClient", "actionClient"].forEach((id) => {
    if (!dom[id]) return;
    const value = dom[id].value;
    dom[id].innerHTML = requiredOptions || `<option value="">Crea un cliente primero</option>`;
    if ([...dom[id].options].some((option) => option.value === value)) dom[id].value = value;
  });

  if (dom.billingFilterClient) dom.billingFilterClient.value = state.billingFilters.clientId;
  if (dom.projectFilterClient) dom.projectFilterClient.value = state.projectFilterClientId;
  if (dom.adminClientFilter) dom.adminClientFilter.value = state.adminFilterClientId;
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
    const value = dom.invoiceProject.value;
    dom.invoiceProject.innerHTML = [`<option value="">General del cliente</option>`].concat(invoiceProjects.map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`)).join("");
    if ([...dom.invoiceProject.options].some((option) => option.value === value)) dom.invoiceProject.value = value;
  }

  if (dom.paymentInvoice) {
    const value = dom.paymentInvoice.value;
    dom.paymentInvoice.innerHTML = [`<option value="">Sin factura</option>`].concat(filteredInvoices({}).map((invoice) => `<option value="${invoice.id}">${escapeHTML(invoice.number)} - ${escapeHTML(getClient(invoice.clientId)?.company || "")}</option>`)).join("");
    if ([...dom.paymentInvoice.options].some((option) => option.value === value)) dom.paymentInvoice.value = value;
  }

  if (dom.paymentProject) {
    const value = dom.paymentProject.value;
    dom.paymentProject.innerHTML = [`<option value="">Sin proyecto</option>`].concat(projects().map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`)).join("");
    if ([...dom.paymentProject.options].some((option) => option.value === value)) dom.paymentProject.value = value;
  }

  [
    ["taskProject", dom.taskClient?.value],
    ["requestProject", dom.requestClient?.value],
    ["noteProject", dom.noteClient?.value],
    ["actionProject", dom.actionClient?.value]
  ].forEach(([id, clientId]) => {
    if (!dom[id]) return;
    const value = dom[id].value;
    const rows = clientId ? projects().filter((project) => project.clientId === clientId) : projects();
    dom[id].innerHTML = [`<option value="">General</option>`].concat(rows.map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`)).join("");
    if ([...dom[id].options].some((option) => option.value === value)) dom[id].value = value;
  });
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

export function resetClientForm() {
  dom.clientForm.reset();
  dom.clientId.value = "";
  dom.clientFirstContact.value = toInputDate(new Date());
  dom.clientLastContact.value = toInputDate(new Date());
  dom.clientFormTitle.textContent = "Crear cliente";
}

export function resetTaskForm() {
  dom.taskForm?.reset();
  if (!dom.taskForm) return;
  dom.taskId.value = "";
  dom.taskDueDate.value = toInputDate(new Date(Date.now() + 7 * DAY_MS));
  dom.taskFormTitle.textContent = "Nueva tarea";
}

export function resetGoalForm() {
  dom.goalForm?.reset();
  if (!dom.goalForm) return;
  dom.goalId.value = "";
  dom.goalDueDate.value = toInputDate(new Date(Date.now() + 30 * DAY_MS));
  dom.goalFormTitle.textContent = "Nueva meta";
}

export function resetRequestForm() {
  dom.requestForm?.reset();
  if (!dom.requestForm) return;
  dom.requestId.value = "";
  dom.requestDate.value = toInputDate(new Date());
  dom.requestDueDate.value = toInputDate(new Date(Date.now() + 7 * DAY_MS));
  dom.requestFormTitle.textContent = "Nuevo pedido";
}

export function resetNoteForm() {
  dom.noteForm?.reset();
  if (!dom.noteForm) return;
  dom.noteId.value = "";
  dom.noteFormTitle.textContent = "Nota interna";
}

export function resetActionForm() {
  dom.actionForm?.reset();
  if (!dom.actionForm) return;
  dom.actionId.value = "";
  dom.actionDueDate.value = toInputDate(new Date(Date.now() + 3 * DAY_MS));
  dom.actionFormTitle.textContent = "Nueva accion";
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

  const taskRows = tasks().map((task) => ({
    origin: "Tarea",
    title: task.title,
    detail: getClient(task.clientId)?.company || task.responsible || "",
    amount: 0,
    currency: "ARS",
    date: task.dueDate,
    type: "tarea",
    sign: "",
    status: task.status,
    clientId: task.clientId
  }));

  const goalRows = goals().map((goal) => ({
    origin: "Meta",
    title: goal.name,
    detail: `${labelize(goal.type)} - ${goalProgressPercent(goal)}%`,
    amount: goal.current,
    currency: "ARS",
    date: goal.dueDate,
    type: "meta",
    sign: "",
    status: goal.status,
    clientId: ""
  }));

  return paymentRows.concat(movementRows, taskRows, goalRows).sort((a, b) => parseDate(b.date) - parseDate(a.date));
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

function getCalendarEvents() {
  const invoiceEvents = filteredInvoices({})
    .filter((invoice) => ["pendiente", "vencida"].includes(normalizedInvoiceStatus(invoice)))
    .map((invoice) => ({
      title: `Cobrar ${invoice.number}`,
      detail: getClient(invoice.clientId)?.company || "Cliente",
      date: invoice.dueDate,
      description: `Factura ${invoice.number} - ${formatMoney(invoice.amount, invoice.currency)}`
    }));
  const taskEvents = tasks()
    .filter((task) => !["completada", "cancelada"].includes(task.status))
    .map((task) => ({
      title: task.title,
      detail: getClient(task.clientId)?.company || task.responsible || "Tarea",
      date: task.dueDate,
      description: task.description || task.comments || "Tarea interna sCode"
    }));
  const actionEvents = actions()
    .filter((action) => action.status !== "completada")
    .map((action) => ({
      title: action.title,
      detail: getClient(action.clientId)?.company || "Seguimiento",
      date: action.dueDate,
      description: "Proxima accion interna sCode"
    }));
  const projectEvents = projects()
    .filter((project) => project.dueDate && !["finalizado", "entregado", "cancelado"].includes(project.status))
    .map((project) => ({
      title: `Entrega ${project.name}`,
      detail: getClient(project.clientId)?.company || "Proyecto",
      date: project.dueDate,
      description: project.description || "Entrega de proyecto sCode"
    }));
  return invoiceEvents.concat(taskEvents, actionEvents, projectEvents)
    .filter((event) => event.date)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

function googleCalendarUrl(event) {
  const start = parseDate(event.date);
  const end = new Date(start.getTime() + DAY_MS);
  const dates = `${calendarDate(start)}/${calendarDate(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `sWallet - ${event.title}`,
    dates,
    details: `${event.description}\n${event.detail}`,
    location: "sCode Digital Solutions"
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function calendarDate(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
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

export function labelize(value) {
  const labels = {
    en_progreso: "en desarrollo",
    revision: "en revision",
    entregado: "finalizado",
    activo: "cliente activo",
    pendiente: "pendiente",
    finalizado: "proyecto finalizado"
  };
  return (labels[value] || String(value || "")).replaceAll("_", " ");
}

function normalizeClientStatus(status) {
  if (status === "activo") return "cliente_activo";
  if (status === "pendiente") return "en_negociacion";
  if (status === "finalizado") return "proyecto_finalizado";
  return status || "lead";
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
