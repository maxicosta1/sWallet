import { canDelete, canWrite, currentUser, isAuthenticated } from "./auth.js";
import {
  actions,
  billingSummaryByClient,
  billingTotals,
  budgets,
  calendarEvents,
  clientAdminSummary,
  clientHealth,
  clientPortalItems,
  clients,
  companyProgress,
  documents,
  filteredInvoices,
  globalTotals,
  goalProgressPercent,
  goals,
  invoices,
  invoiceAmountARS,
  movements,
  notifications,
  normalizedInvoiceStatus,
  notes,
  opportunities,
  paidForInvoice,
  payments,
  projectFinancials,
  projects,
  requests,
  searchResults,
  subscriptions,
  supportPlans,
  teamMembers,
  marketingCampaigns,
  tasks,
  totalsForMonth,
  upcomingPayments
} from "./finance.js";
import { parseDate, SCHEMA_VERSION, state, toInputDate, DAY_MS } from "./state.js";

export const dom = {};

const titles = {
  dashboard: "Dashboard financiero",
  clientes: "Clientes",
  crm: "CRM / Ventas",
  proyectos: "Proyectos",
  finanzas: "Finanzas",
  pagos: "Pagos",
  facturacion: "Facturacion",
  presupuestos: "Presupuestos",
  calendario: "Calendario",
  administracion: "Administracion",
  tareas: "Tareas",
  metas: "Metas",
  documentos: "Documentos",
  soporte: "Soporte",
  equipo: "Equipo",
  marketing: "Marketing",
  portal: "Portal cliente",
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
    dom.loginPanel.hidden = false;
    return;
  }

  const user = currentUser();
  document.querySelectorAll("[data-user-brand]").forEach((item) => {
    item.textContent = displayBrandName(user);
  });
  dom.sessionUser.textContent = user.email;
  dom.sessionRole.textContent = user.role.replace("_", " ");
  document.querySelectorAll("[data-session-avatar]").forEach((item) => {
    item.innerHTML = avatarMarkup(user);
  });
  document.body.classList.toggle("read-only", !canWrite());
}

function displayBrandName(user) {
  const username = String(user?.username || user?.name || "").toLowerCase();
  if (username.includes("maxi")) return "Maxi";
  if (username.includes("fran")) return "Fran";
  return user?.name?.split(" ")[0] || "sCode";
}

export function renderAll() {
  renderAuth();
  if (!isAuthenticated()) return;
  updatePageTitle(state.activeView);
  syncActiveNavigation(state.activeView);
  syncControls();
  renderBankingHero();
  renderStats();
  renderDashboardLists();
  renderGlobalSearch();
  renderNotifications();
  renderDashboardCalendar();
  renderClients();
  renderClientKanban();
  renderCRM();
  renderProjects();
  renderFinance();
  renderInvoices();
  renderPayments();
  renderBudgets();
  renderCalendarModule();
  renderMovements();
  renderSubscriptions();
  renderAdministration();
  renderTasks();
  renderGoals();
  renderDocuments();
  renderSupport();
  renderTeam();
  renderMarketing();
  renderClientPortal();
  renderSettings();
  renderReports();
  drawAllCharts();
  applyCompanyTheme();
}

export function renderView(view) {
  if (!isAuthenticated()) {
    renderAuth();
    return;
  }
  state.activeView = view;
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  syncActiveNavigation(view);
  updatePageTitle(view);
  closeMobileMenu();
  drawAllCharts();
}

function syncActiveNavigation(view) {
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === view));
  document.querySelectorAll(".mobile-bank-nav [data-view]").forEach((link) => link.classList.toggle("active", link.dataset.view === view));
}

function updatePageTitle(view) {
  const title = titles[view] || "Dashboard financiero";
  const firstName = displayBrandName(currentUser()) || "usuario";
  const dashboardTitle = `Bienvenido: ${firstName}`;
  dom.pageTitle.textContent = view === "dashboard" ? dashboardTitle : title;
  dom.pageTitle.dataset.mobileTitle = view === "dashboard" ? dashboardTitle : title;
}

export function syncControls() {
  populateClientSelects();
  populateProjectSelects();
  syncFilterControls();
  dom.exchangeRate.value = state.exchangeRate;
}

function syncFilterControls() {
  if (dom.crmFilterStatus) dom.crmFilterStatus.value = state.crmFilters.status;
  if (dom.crmFilterTerm) dom.crmFilterTerm.value = state.crmFilters.term;
  if (dom.budgetFilterStatus) dom.budgetFilterStatus.value = state.budgetFilters.status;
  if (dom.budgetFilterTerm) dom.budgetFilterTerm.value = state.budgetFilters.term;
  if (dom.documentFilterType) dom.documentFilterType.value = state.documentFilters.type;
  if (dom.documentFilterTerm) dom.documentFilterTerm.value = state.documentFilters.term;
  if (dom.supportFilterStatus) dom.supportFilterStatus.value = state.supportFilters.status;
  if (dom.supportFilterTerm) dom.supportFilterTerm.value = state.supportFilters.term;
  if (dom.marketingFilterStatus) dom.marketingFilterStatus.value = state.marketingFilters.status;
  if (dom.marketingFilterTerm) dom.marketingFilterTerm.value = state.marketingFilters.term;
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
  const activeProjects = projects().filter((project) => !["finalizado", "entregado", "cancelado"].includes(project.status)).length;
  const overdue = filteredInvoices({ clientId: "", projectId: "", status: "vencida", currency: "", from: "", to: "", quick: "" }).length;
  const cards = [
    ["Saldo total", formatARS(totals.balanceARS), "Caja operativa consolidada", "green"],
    ["Ingresos del mes", formatARS(month.income), "Cobros + ingresos", "blue"],
    ["Gastos del mes", formatARS(month.expenses), "Salidas registradas", "coral"],
    ["Ganancia neta", formatARS(month.profit), "Resultado del mes", month.profit >= 0 ? "green" : "coral"],
    ["Pendiente", formatARS(billing.pendiente), "Por cobrar", "coral"],
    ["Proyectos activos", activeProjects.toString(), `${overdue} pagos vencidos`, "blue"]
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

  renderTodaySummary();
}

function renderTodaySummary() {
  if (!dom.todaySummary) return;
  const todayKey = toInputDate(new Date());
  const todayEvents = calendarEvents().filter((event) => event.date === todayKey);
  const overdueTasks = tasks().filter((task) => !["completada", "cancelada"].includes(task.status) && parseDate(task.dueDate) < new Date());
  const dueInvoices = upcomingPayments().filter((invoice) => normalizedInvoiceStatus(invoice) === "vencida" || invoice.dueDate === todayKey);
  const followUps = actions().filter((action) => action.status !== "completada" && action.dueDate <= todayKey);
  const rows = [
    ...todayEvents.map((event) => ({ title: event.title, detail: `${labelize(event.type)} - ${event.startTime || "sin hora"}`, tone: event.priority || "neutral" })),
    ...overdueTasks.slice(0, 3).map((task) => ({ title: task.title, detail: `Tarea vencida - ${getClient(task.clientId)?.company || task.responsible || ""}`, tone: "vencida" })),
    ...dueInvoices.slice(0, 3).map((invoice) => ({ title: invoice.number, detail: `Cobrar ${getClient(invoice.clientId)?.company || "cliente"}`, tone: normalizedInvoiceStatus(invoice) })),
    ...followUps.slice(0, 3).map((action) => ({ title: action.title, detail: `Seguimiento - ${getClient(action.clientId)?.company || ""}`, tone: action.priority || "pendiente" }))
  ].slice(0, 6);
  dom.todaySummary.innerHTML = rows.length ? rows.map((item) => `
    <article class="list-item">
      <div><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.detail)}</span></div>
      <span class="badge ${item.tone}">${labelize(item.tone)}</span>
    </article>
  `).join("") : emptyState("Hoy no hay urgencias cargadas.");
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

function renderMonthGrid(events) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: startOffset + last.getDate() }, (_, index) => {
    const day = index - startOffset + 1;
    if (day < 1) return `<span class="calendar-day muted"></span>`;
    const dateKey = toInputDate(new Date(year, month, day));
    const dayEvents = events.filter((event) => event.date === dateKey);
    return `<button class="calendar-day ${dateKey === toInputDate(now) ? "today" : ""} ${dayEvents.length ? "has-event" : ""}" type="button"><span>${day}</span>${dayEvents.length ? `<i>${dayEvents.length}</i>` : ""}</button>`;
  });
  return `<div class="calendar-weekdays"><span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span></div><div class="calendar-days">${days.join("")}</div>`;
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
  syncCompanySettingsForm();
  dom.settingsSession.innerHTML = `
    <article class="list-item account-profile-item"><div class="user-avatar large" data-session-avatar>${avatarMarkup(user)}</div><div><strong>${escapeHTML(user.name)}</strong><span>@${escapeHTML(user.username || "usuario")} - ${escapeHTML(user.email)}</span></div><span class="badge ${user.role}">${labelize(user.role)}</span></article>
    <article class="list-item"><div><strong>Permisos</strong><span>${canWrite() ? "Puede crear y editar" : "Solo visualizacion"}</span></div><span class="badge ${canDelete() ? "admin" : "neutral"}">${canDelete() ? "admin" : "limitado"}</span></article>
  `;
  if (dom.profilePhotoUrl) dom.profilePhotoUrl.value = user.avatar || "";
  if (dom.authUsersTable) {
    dom.authUsersTable.innerHTML = state.users.length ? state.users.map((item) => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${avatarMarkup(item)}</div>
            <div class="entity-title"><strong>${escapeHTML(item.name)}</strong><span>@${escapeHTML(item.username || "-")}${item.id === user.id ? " - sesion actual" : ""}</span></div>
          </div>
        </td>
        <td><div class="entity-title"><strong>${escapeHTML(item.email)}</strong><span>${escapeHTML(item.area || "Sin area")} ${item.phone ? `- ${escapeHTML(item.phone)}` : ""}</span></div></td>
        <td>
          <select class="table-select write-action" onchange="updateAuthUserRole('${item.id}', this.value)" ${item.id === user.id ? "disabled" : ""}>
            <option value="admin" ${item.role === "admin" ? "selected" : ""}>Admin</option>
            <option value="finanzas" ${item.role === "finanzas" ? "selected" : ""}>Finanzas</option>
            <option value="solo_lectura" ${item.role === "solo_lectura" ? "selected" : ""}>Solo lectura</option>
          </select>
          <span class="badge ${item.role}">${labelize(item.role)}</span>
        </td>
        <td><div class="permission-tags">${(item.permissions || []).map((permission) => `<span>${escapeHTML(labelize(permission))}</span>`).join("") || "<span>reportes</span>"}</div></td>
        <td>
          <select class="table-select write-action" onchange="updateAuthUserStatus('${item.id}', this.value)" ${item.id === user.id ? "disabled" : ""}>
            <option value="activo" ${(item.status || "activo") === "activo" ? "selected" : ""}>Activo</option>
            <option value="inactivo" ${item.status === "inactivo" ? "selected" : ""}>Inactivo</option>
          </select>
          <span class="badge ${item.status || "activo"}">${labelize(item.status || "activo")}</span>
        </td>
        <td><button class="danger-button compact delete-action" type="button" onclick="deleteAuthUser('${item.id}')" ${item.id === user.id ? "disabled" : ""}>Eliminar</button></td>
      </tr>
    `).join("") : tableEmpty(6, "No hay usuarios creados.");
  }
  const diagnostics = dataIntegrityIssues();
  dom.settingsData.innerHTML = `
    <article class="list-item"><div><strong>Datos locales</strong><span>${clients().length} clientes, ${projects().length} proyectos, ${tasks().length} tareas, ${budgets().length} presupuestos, ${calendarEvents().length} eventos</span></div><span class="badge saludable">localStorage</span></article>
    <article class="list-item"><div><strong>Version de datos</strong><span>Schema actual ${SCHEMA_VERSION}${state.savedAt ? ` - ultimo guardado ${formatDate(state.savedAt)}` : ""}</span></div><span class="badge neutral">v${state.schemaVersion || SCHEMA_VERSION}</span></article>
    <article class="list-item"><div><strong>Cotizacion</strong><span>1 USD = ${formatARS(state.exchangeRate)}</span></div><span class="badge neutral">editable</span></article>
    <article class="list-item"><div><strong>Backup</strong><span>Exporta o importa toda la base local de sWallet.</span></div><span class="badge neutral">JSON</span></article>
    <article class="list-item"><div><strong>Diagnostico</strong><span>${diagnostics.length ? `${diagnostics.length} alerta(s) de integridad detectada(s)` : "Relaciones principales correctas"}</span></div><span class="badge ${diagnostics.length ? "urgente" : "saludable"}">${diagnostics.length ? "revisar" : "OK"}</span></article>
    ${diagnostics.slice(0, 8).map((item) => `<article class="list-item audit-item"><div><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.detail)}</span></div><span class="badge ${item.tone}">${escapeHTML(item.label)}</span></article>`).join("")}
  `;
  if (dom.activityLogList) {
    const rows = state.activityLogs
      .filter((item) => !item.userId || item.userId === user.id)
      .slice(0, 40);
    dom.activityLogList.innerHTML = rows.length ? rows.map((item) => `
      <article class="list-item audit-item">
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <span>${formatDate(item.date || item.createdAt)} - ${escapeHTML(item.message || "")}</span>
        </div>
        <span class="badge neutral">${escapeHTML(item.view || "sistema")}</span>
      </article>
    `).join("") : emptyState("Todavia no hay actividad registrada.");
  }
}

function avatarMarkup(user) {
  return user?.avatar
    ? `<img src="${escapeAttribute(user.avatar)}" alt="">`
    : escapeHTML((user?.name || user?.username || "U").slice(0, 1).toUpperCase());
}

function dataIntegrityIssues() {
  const issues = [];
  const clientIds = new Set(clients().map((client) => client.id));
  const projectIds = new Set(projects().map((project) => project.id));
  const invoiceIds = new Set(invoices().map((invoice) => invoice.id));

  projects().forEach((project) => {
    if (!clientIds.has(project.clientId)) issues.push({ title: "Proyecto sin cliente valido", detail: project.name || project.id, label: "proyecto", tone: "urgente" });
  });

  invoices().forEach((invoice) => {
    if (!clientIds.has(invoice.clientId)) issues.push({ title: "Factura sin cliente valido", detail: invoice.number || invoice.id, label: "factura", tone: "urgente" });
    if (invoice.projectId && !projectIds.has(invoice.projectId)) issues.push({ title: "Factura con proyecto inexistente", detail: invoice.number || invoice.id, label: "factura", tone: "alta" });
    if (invoice.projectId && getProject(invoice.projectId)?.clientId !== invoice.clientId) issues.push({ title: "Factura con proyecto de otro cliente", detail: invoice.number || invoice.id, label: "factura", tone: "alta" });
  });

  payments().forEach((payment) => {
    if (!clientIds.has(payment.clientId)) issues.push({ title: "Pago sin cliente valido", detail: payment.notes || payment.id, label: "pago", tone: "urgente" });
    if (payment.invoiceId && !invoiceIds.has(payment.invoiceId)) issues.push({ title: "Pago con factura inexistente", detail: payment.notes || payment.id, label: "pago", tone: "alta" });
    if (payment.projectId && !projectIds.has(payment.projectId)) issues.push({ title: "Pago con proyecto inexistente", detail: payment.notes || payment.id, label: "pago", tone: "alta" });
  });

  tasks().forEach((task) => {
    if (!clientIds.has(task.clientId)) issues.push({ title: "Tarea sin cliente valido", detail: task.title || task.id, label: "tarea", tone: "alta" });
    if (task.projectId && getProject(task.projectId)?.clientId !== task.clientId) issues.push({ title: "Tarea con proyecto de otro cliente", detail: task.title || task.id, label: "tarea", tone: "alta" });
  });

  documents().forEach((documentItem) => {
    if (documentItem.projectId && getProject(documentItem.projectId)?.clientId !== documentItem.clientId) issues.push({ title: "Documento con proyecto de otro cliente", detail: documentItem.name || documentItem.id, label: "documento", tone: "media" });
  });

  supportPlans().forEach((plan) => {
    if (!clientIds.has(plan.clientId)) issues.push({ title: "Mantenimiento sin cliente valido", detail: plan.plan || plan.id, label: "soporte", tone: "alta" });
    if (plan.projectId && getProject(plan.projectId)?.clientId !== plan.clientId) issues.push({ title: "Mantenimiento con proyecto de otro cliente", detail: plan.plan || plan.id, label: "soporte", tone: "media" });
  });

  return issues;
}

function syncCompanySettingsForm() {
  if (!dom.companySettingsForm) return;
  const settings = state.companySettings;
  dom.companyName.value = settings.name || "";
  dom.companyLegalName.value = settings.legalName || "";
  dom.companyEmail.value = settings.email || "";
  dom.companyWebsite.value = settings.website || "";
  dom.companyPrimaryColor.value = settings.primaryColor || "#9f5cff";
  dom.companyMainCurrency.value = settings.mainCurrency || "ARS";
  dom.companySecondaryCurrency.value = settings.secondaryCurrency || "USD";
  dom.companyReminderDays.value = settings.reminderDays || 5;
  dom.companyServices.value = settings.services || "";
  dom.companyFinanceCategories.value = settings.financeCategories || "";
}

function applyCompanyTheme() {
  const color = state.companySettings?.primaryColor || "#9f5cff";
  document.documentElement.style.setProperty("--primary", color);
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
          <button class="ghost-button compact" type="button" onclick="printInvoice('${invoice.id}')">Imprimir</button>
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
          <button class="ghost-button compact" type="button" onclick="printPayment('${payment.id}')">Comprobante</button>
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

function renderCRM() {
  if (!dom.crmPipeline) return;
  const stages = ["lead_nuevo", "contactado", "respondio", "reunion_agendada", "presupuesto_enviado", "negociacion", "aprobado", "rechazado", "perdido"];
  const filters = state.crmFilters;
  dom.crmPipeline.innerHTML = stages.map((stage) => {
    const rows = opportunities()
      .filter((item) => item.status === stage)
      .filter((item) => !filters.clientId || item.clientId === filters.clientId)
      .filter((item) => !filters.status || item.status === filters.status)
      .filter((item) => matchesTerm([item.title, item.service, item.nextAction, item.responsible, item.notes], filters.term));
    return `
      <section class="kanban-column">
        <header><strong>${labelize(stage)}</strong><span>${rows.length}</span></header>
        ${rows.length ? rows.map((item) => `
          <article class="kanban-card">
            <strong>${escapeHTML(item.title)}</strong>
            <span>${escapeHTML(getClient(item.clientId)?.company || "Sin cliente")}</span>
            <div class="card-meta"><span>${formatMoney(item.value || 0, item.currency || "ARS")}</span><span>${Number(item.probability || 0)}%</span></div>
            <small>${escapeHTML(item.nextAction || "Sin proxima accion")}</small>
            <div class="actions-cell">
              <button class="ghost-button compact write-action" type="button" onclick="editOpportunity('${item.id}')">Editar</button>
              <button class="primary-button compact write-action" type="button" onclick="convertOpportunityToProject('${item.id}')">Proyecto</button>
              <button class="danger-button compact delete-action" type="button" onclick="deleteOpportunity('${item.id}')">Eliminar</button>
            </div>
          </article>
        `).join("") : `<p class="kanban-empty">Sin oportunidades</p>`}
      </section>
    `;
  }).join("");
}

function renderBudgets() {
  if (!dom.budgetsTable) return;
  const filters = state.budgetFilters;
  const rows = budgets()
    .filter((item) => !filters.clientId || item.clientId === filters.clientId)
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => matchesTerm([item.projectName, item.services, item.notes], filters.term))
    .sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));
  dom.budgetsTable.innerHTML = rows.length ? rows.map((item) => {
    const total = budgetTotal(item);
    return `
      <tr>
        <td><div class="entity-title"><strong>${escapeHTML(item.projectName)}</strong><span>${escapeHTML(getClient(item.clientId)?.company || "Sin cliente")}</span></div></td>
        <td>${formatMoney(total, item.currency)}</td>
        <td>${item.discount ? formatMoney(item.discount, item.currency) : "-"}</td>
        <td>${formatDate(item.validUntil)}</td>
        <td><span class="badge ${item.status}">${labelize(item.status)}</span></td>
        <td>
          <div class="actions-cell">
            <button class="ghost-button compact write-action" type="button" onclick="editBudget('${item.id}')">Editar</button>
            <button class="ghost-button compact" type="button" onclick="printBudget('${item.id}')">Imprimir</button>
            <button class="ghost-button compact write-action" type="button" onclick="setBudgetStatus('${item.id}', 'enviado')">Enviar</button>
            <button class="ghost-button compact write-action" type="button" onclick="setBudgetStatus('${item.id}', 'rechazado')">Rechazar</button>
            <button class="ghost-button compact write-action" type="button" onclick="duplicateBudget('${item.id}')">Duplicar</button>
            <button class="primary-button compact write-action" type="button" onclick="convertBudgetToProject('${item.id}')">Proyecto</button>
            <button class="danger-button compact delete-action" type="button" onclick="deleteBudget('${item.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("") : tableEmpty(6, "No hay presupuestos cargados.");
}

function renderCalendarModule() {
  if (!dom.calendarEventsTable) return;
  const events = getCalendarEvents().concat(calendarEvents().map((event) => ({
    ...event,
    detail: getClient(event.clientId)?.company || "Interno",
    description: event.description || labelize(event.type),
    manual: true
  }))).sort((a, b) => parseDate(a.date) - parseDate(b.date));
  dom.fullCalendarGrid.innerHTML = renderMonthGrid(events);
  dom.calendarEventsTable.innerHTML = events.length ? events.slice(0, 18).map((event) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(event.title)}</strong><span>${escapeHTML(event.detail || labelize(event.type))}</span></div></td>
      <td>${formatDate(event.date)} ${event.startTime ? escapeHTML(event.startTime) : ""}</td>
      <td><span class="badge ${event.priority || event.type || "pendiente"}">${labelize(event.type || event.priority || "evento")}</span></td>
      <td>
        <div class="actions-cell">
          <a class="ghost-button compact" href="${googleCalendarUrl(event)}" target="_blank" rel="noreferrer">Google</a>
          ${event.manual ? `<button class="ghost-button compact write-action" type="button" onclick="editCalendarEvent('${event.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteCalendarEvent('${event.id}')">Eliminar</button>` : ""}
        </div>
      </td>
    </tr>
  `).join("") : tableEmpty(4, "No hay eventos programados.");
}

function renderDocuments() {
  if (!dom.documentsGrid) return;
  const filters = state.documentFilters;
  const rows = documents()
    .filter((item) => !filters.clientId || item.clientId === filters.clientId)
    .filter((item) => !filters.type || String(item.type || "").toLowerCase().includes(filters.type.toLowerCase()))
    .filter((item) => matchesTerm([item.name, item.type, item.tags, item.description], filters.term));
  dom.documentsGrid.innerHTML = rows.length ? rows.map((item) => `
    <article class="resource-card">
      <span class="badge ${item.type}">${labelize(item.type)}</span>
      <strong>${escapeHTML(item.name)}</strong>
      <p>${escapeHTML(getClient(item.clientId)?.company || "Documento interno")} - ${escapeHTML(getProject(item.projectId)?.name || "General")}</p>
      <small>${escapeHTML(item.tags || "Sin etiquetas")}</small>
      <div class="actions-cell">
        ${item.link ? `<a class="ghost-button compact" href="${escapeAttribute(item.link)}" target="_blank" rel="noreferrer">Abrir</a>` : ""}
        <button class="ghost-button compact" type="button" onclick="printDocument('${item.id}')">Imprimir</button>
        <button class="ghost-button compact write-action" type="button" onclick="editDocument('${item.id}')">Editar</button>
        <button class="danger-button compact delete-action" type="button" onclick="deleteDocument('${item.id}')">Eliminar</button>
      </div>
    </article>
  `).join("") : emptyState("No hay documentos guardados.");
}

function renderSupport() {
  if (!dom.supportTable) return;
  const filters = state.supportFilters;
  const rows = supportPlans()
    .filter((item) => !filters.clientId || item.clientId === filters.clientId)
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => matchesTerm([item.url, item.domain, item.hosting, item.plan, item.notes], filters.term))
    .sort((a, b) => parseDate(a.hostingRenewal || a.domainRenewal) - parseDate(b.hostingRenewal || b.domainRenewal));
  dom.supportTable.innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(getClient(item.clientId)?.company || "Sin cliente")}</strong><span>${escapeHTML(item.url || item.domain || "")}</span></div></td>
      <td>${escapeHTML(item.plan)}</td>
      <td>${formatMoney(item.monthlyPrice || 0, item.currency || "ARS")}</td>
      <td>${formatDate(item.domainRenewal)} / ${formatDate(item.hostingRenewal)}</td>
      <td><span class="badge ${item.status}">${labelize(item.status)}</span></td>
      <td><div class="actions-cell"><button class="ghost-button compact write-action" type="button" onclick="editSupportPlan('${item.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteSupportPlan('${item.id}')">Eliminar</button></div></td>
    </tr>
  `).join("") : tableEmpty(6, "No hay planes de soporte.");
}

function renderTeam() {
  if (!dom.teamTable) return;
  const rows = teamMembers();
  dom.teamTable.innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.email)}</span></div></td>
      <td>${escapeHTML(item.role)}</td>
      <td>${escapeHTML(item.focus || "-")}</td>
      <td><span class="badge ${item.status}">${labelize(item.status)}</span></td>
      <td><div class="actions-cell"><button class="ghost-button compact write-action" type="button" onclick="editTeamMember('${item.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteTeamMember('${item.id}')">Eliminar</button></div></td>
    </tr>
  `).join("") : tableEmpty(5, "No hay miembros del equipo.");
}

function renderMarketing() {
  if (!dom.marketingTable) return;
  const filters = state.marketingFilters;
  const rows = marketingCampaigns()
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => matchesTerm([item.name, item.target, item.message], filters.term))
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));
  dom.marketingTable.innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td><div class="entity-title"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.target)}</span></div></td>
      <td>${Number(item.contacts || 0)} / ${Number(item.responses || 0)} / ${Number(item.meetings || 0)} / ${Number(item.sales || 0)}</td>
      <td>${conversionRate(item.responses, item.contacts)}%</td>
      <td><span class="badge ${item.status}">${labelize(item.status)}</span></td>
      <td><div class="actions-cell"><button class="ghost-button compact write-action" type="button" onclick="editMarketingCampaign('${item.id}')">Editar</button><button class="danger-button compact delete-action" type="button" onclick="deleteMarketingCampaign('${item.id}')">Eliminar</button></div></td>
    </tr>
  `).join("") : tableEmpty(5, "No hay campanas cargadas.");
  dom.marketingTemplates.innerHTML = ["Estudios contables", "Arquitectos", "Hoteles", "Restaurantes", "Gimnasios", "Inmobiliarias"].map((target) => `
    <article class="list-item"><div><strong>${target}</strong><span>Mensaje base: web premium para captar mas consultas y ordenar presencia digital.</span></div></article>
  `).join("");
}

function renderClientPortal() {
  if (!dom.portalClient) return;
  if (!state.selectedPortalClientId && clients()[0]) state.selectedPortalClientId = clients()[0].id;
  dom.portalClient.value = state.selectedPortalClientId;
  const client = getClient(state.selectedPortalClientId);
  if (!client) {
    dom.portalOverview.innerHTML = emptyState("Selecciona un cliente para ver el portal simulado.");
    return;
  }
  const clientProjects = projects().filter((project) => project.clientId === client.id);
  const clientInvoices = filteredInvoices({ clientId: client.id, projectId: "", status: "", currency: "", from: "", to: "", quick: "" });
  const clientPayments = payments().filter((payment) => payment.clientId === client.id && payment.status === "pagado");
  const clientTasks = tasks().filter((task) => task.clientId === client.id);
  const clientRequests = requests().filter((request) => request.clientId === client.id);
  const clientEvents = calendarEvents()
    .filter((event) => event.clientId === client.id && event.date && parseDate(event.date) >= new Date(Date.now() - DAY_MS))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .slice(0, 5);
  const files = documents().filter((doc) => doc.clientId === client.id).concat(clientPortalItems().filter((item) => item.clientId === client.id));
  const pendingAmount = clientInvoices.reduce((total, invoice) => total + Math.max(Number(invoice.amount || 0) - paidForInvoice(invoice.id), 0), 0);
  const billedAmount = clientInvoices.reduce((total, invoice) => total + Number(invoice.amount || 0), 0);
  const paidAmount = clientPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const averageProgress = clientProjects.length ? Math.round(clientProjects.reduce((total, project) => total + Number(project.progress || 0), 0) / clientProjects.length) : 0;
  const openTasks = clientTasks.filter((task) => !["completada", "cancelada"].includes(task.status));
  const openRequests = clientRequests.filter((request) => !["completado", "cancelado"].includes(request.status));
  const primaryCurrency = client.currency || clientInvoices[0]?.currency || "ARS";
  const health = clientHealth(client.id);
  const nextDue = clientInvoices
    .filter((invoice) => normalizedInvoiceStatus(invoice) !== "pagada" && invoice.dueDate)
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))[0];
  dom.portalOverview.innerHTML = `
    <section class="portal-preview">
      <div class="portal-hero">
        <div>
          <p class="eyebrow">Portal cliente simulado</p>
          <h2>${escapeHTML(client.company || client.name)}</h2>
          <p>${escapeHTML(client.service || "Servicios sCode")} · ${escapeHTML(client.email || "Sin email cargado")}</p>
        </div>
        <div class="portal-hero-actions">
          <span class="badge ${health}">${labelize(health)}</span>
          <span class="badge ${normalizeClientStatus(client.status)}">${labelize(normalizeClientStatus(client.status))}</span>
        </div>
      </div>
      <div class="stats-grid compact-stats">
        <article class="stat-card"><span>Proyectos</span><strong>${clientProjects.length}</strong><small>Asociados</small></article>
        <article class="stat-card"><span>Avance promedio</span><strong>${averageProgress}%</strong><small>Delivery visible</small></article>
        <article class="stat-card"><span>Facturado</span><strong>${formatMoney(billedAmount, primaryCurrency)}</strong><small>Total del cliente</small></article>
        <article class="stat-card"><span>Pendiente</span><strong>${formatMoney(pendingAmount, primaryCurrency)}</strong><small>${nextDue ? `Proximo ${formatDate(nextDue.dueDate)}` : "Sin vencimientos"}</small></article>
        <article class="stat-card"><span>Archivos</span><strong>${files.length}</strong><small>Documentos y links</small></article>
      </div>
      <div class="portal-layout">
        <article class="portal-section portal-main-card">
          <div class="section-title-row"><div><p class="eyebrow">Proyecto y avance</p><h3>Estado de entregas</h3></div><span>${clientProjects.length} items</span></div>
          <div class="portal-project-list">
            ${clientProjects.length ? clientProjects.map((project) => {
              const financials = projectFinancials(project.id);
              return `
                <article class="portal-project-card">
                  <div class="section-title-row">
                    <div><strong>${escapeHTML(project.name)}</strong><span>${escapeHTML(labelize(project.status))}</span></div>
                    <span class="badge ${project.status}">${Number(project.progress || 0)}%</span>
                  </div>
                  <p>${escapeHTML(project.description || "Sin descripcion cargada.")}</p>
                  <div class="progress-bar"><i style="width:${Number(project.progress || 0)}%"></i></div>
                  <div class="portal-mini-metrics">
                    <span>Presupuesto <strong>${formatMoney(project.budget || 0, project.currency || primaryCurrency)}</strong></span>
                    <span>Cobrado <strong>${formatMoney(financials.paid || 0, project.currency || primaryCurrency)}</strong></span>
                    <span>Pendiente <strong>${formatMoney(financials.pending || 0, project.currency || primaryCurrency)}</strong></span>
                  </div>
                </article>
              `;
            }).join("") : emptyState("Sin proyectos para mostrar.")}
          </div>
        </article>

        <aside class="portal-section">
          <div class="section-title-row"><div><p class="eyebrow">Resumen financiero</p><h3>Cuenta del cliente</h3></div></div>
          <div class="portal-account-card">
            <span>Total cobrado</span>
            <strong>${formatMoney(paidAmount, primaryCurrency)}</strong>
            <small>Saldo pendiente ${formatMoney(pendingAmount, primaryCurrency)}</small>
          </div>
          <div class="portal-list">
            ${clientInvoices.length ? clientInvoices.slice(0, 5).map((invoice) => {
              const status = normalizedInvoiceStatus(invoice);
              const paid = paidForInvoice(invoice.id);
              return `<article class="portal-list-item"><div><strong>${escapeHTML(invoice.number)}</strong><span>${escapeHTML(getProject(invoice.projectId)?.name || "General")} · vence ${formatDate(invoice.dueDate)}</span></div><div><b>${formatMoney(Math.max(Number(invoice.amount || 0) - paid, 0), invoice.currency)}</b><span class="badge ${status}">${labelize(status)}</span></div></article>`;
            }).join("") : emptyState("Sin facturas visibles.")}
          </div>
        </aside>

        <article class="portal-section">
          <div class="section-title-row"><div><p class="eyebrow">Trabajo abierto</p><h3>Tareas y pedidos</h3></div><span>${openTasks.length + openRequests.length} pendientes</span></div>
          <div class="portal-list">
            ${openTasks.slice(0, 4).map((task) => `<article class="portal-list-item"><div><strong>${escapeHTML(task.title)}</strong><span>Tarea · ${escapeHTML(getProject(task.projectId)?.name || "General")}</span></div><span class="badge ${task.priority}">${labelize(task.priority)}</span></article>`).join("")}
            ${openRequests.slice(0, 4).map((request) => `<article class="portal-list-item"><div><strong>${escapeHTML(request.description)}</strong><span>Pedido · ${escapeHTML(labelize(request.type))}</span></div><span class="badge ${request.status}">${labelize(request.status)}</span></article>`).join("")}
            ${openTasks.length + openRequests.length ? "" : emptyState("No hay tareas ni pedidos abiertos.")}
          </div>
        </article>

        <article class="portal-section">
          <div class="section-title-row"><div><p class="eyebrow">Agenda</p><h3>Proximos hitos</h3></div></div>
          <div class="portal-list">
            ${clientEvents.length ? clientEvents.map((event) => `<article class="portal-list-item"><div><strong>${escapeHTML(event.title)}</strong><span>${formatDate(event.date)} · ${escapeHTML(event.startTime || "sin hora")}</span></div><span class="badge ${event.type}">${labelize(event.type)}</span></article>`).join("") : emptyState("Sin eventos proximos.")}
          </div>
        </article>

        <article class="portal-section portal-files">
          <div class="section-title-row"><div><p class="eyebrow">Documentos</p><h3>Archivos y links</h3></div></div>
          <div class="resource-grid">
            ${files.length ? files.slice(0, 8).map((file) => `<article class="resource-card"><span class="badge ${file.type || "avance"}">${labelize(file.type || "link")}</span><strong>${escapeHTML(file.name || file.title)}</strong><p>${escapeHTML(file.description || file.notes || "Recurso disponible para el cliente.")}</p>${file.link ? `<a class="ghost-button compact" href="${escapeAttribute(file.link)}" target="_blank" rel="noreferrer">Abrir</a>` : ""}</article>`).join("") : emptyState("Sin documentos o links cargados.")}
          </div>
        </article>
      </div>
    </section>
  `;
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
  if (dom.reportInsights) dom.reportInsights.innerHTML = reportInsights().map((item) => `
    <article class="resource-card insight-card">
      <span class="badge ${item.tone}">${escapeHTML(item.label)}</span>
      <strong>${escapeHTML(item.title)}</strong>
      <p>${escapeHTML(item.detail)}</p>
    </article>
  `).join("");
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

function reportInsights() {
  const month = totalsForMonth();
  const overdue = filteredInvoices({ clientId: "", projectId: "", status: "vencida", currency: "", from: "", to: "", quick: "" });
  const activeProjects = projects().filter((project) => !["finalizado", "entregado", "cancelado"].includes(project.status));
  const lateProjects = activeProjects.filter((project) => project.dueDate && parseDate(project.dueDate) < new Date());
  const pendingTasks = tasks().filter((task) => !["completada", "cancelada"].includes(task.status));
  const wonOpportunities = opportunities().filter((item) => item.status === "aprobado").length;
  const totalOpportunities = Math.max(opportunities().length, 1);
  const sentBudgets = budgets().filter((budget) => budget.status === "enviado").length;
  const insights = [
    {
      label: "Finanzas",
      title: month.profit >= 0 ? "Resultado positivo del mes" : "Resultado negativo del mes",
      detail: `Ganancia real estimada: ${formatARS(month.profit)}.`,
      tone: month.profit >= 0 ? "saludable" : "vencida"
    },
    {
      label: "Cobranza",
      title: overdue.length ? "Hay pagos vencidos" : "Cobranza sin vencidos criticos",
      detail: overdue.length ? `${overdue.length} factura(s) requieren seguimiento.` : "No hay facturas vencidas en los filtros actuales.",
      tone: overdue.length ? "vencida" : "saludable"
    },
    {
      label: "Delivery",
      title: lateProjects.length ? "Proyectos atrasados detectados" : "Delivery bajo control",
      detail: `${activeProjects.length} proyectos activos, ${lateProjects.length} atrasados.`,
      tone: lateProjects.length ? "vencida" : "neutral"
    },
    {
      label: "Equipo",
      title: `${pendingTasks.length} tareas abiertas`,
      detail: "Usar el tablero de tareas para ordenar responsables y urgencias.",
      tone: pendingTasks.length > 6 ? "coral" : "neutral"
    },
    {
      label: "Comercial",
      title: `Conversion CRM ${Math.round((wonOpportunities / totalOpportunities) * 100)}%`,
      detail: `${sentBudgets} presupuesto(s) enviados esperando respuesta.`,
      tone: sentBudgets ? "pendiente" : "neutral"
    }
  ];
  return insights;
}

function populateClientSelects() {
  const options = [`<option value="">Todos</option>`].concat(clients().map((client) => `<option value="${client.id}">${escapeHTML(client.company)} - ${escapeHTML(client.name)}</option>`));
  const requiredOptions = clients().map((client) => `<option value="${client.id}">${escapeHTML(client.company)} - ${escapeHTML(client.name)}</option>`).join("");

  ["filterClient", "billingFilterClient", "projectFilterClient", "adminClientFilter", "portalClient", "crmFilterClient", "budgetFilterClient", "documentFilterClient", "supportFilterClient"].forEach((id) => {
    if (!dom[id]) return;
    const value = dom[id].value;
    dom[id].innerHTML = options.join("");
    if ([...dom[id].options].some((option) => option.value === value)) dom[id].value = value;
  });

  ["paymentClient", "projectClient", "invoiceClient", "taskClient", "requestClient", "noteClient", "actionClient", "opportunityClient", "budgetClient", "calendarEventClient", "documentClient", "supportClient"].forEach((id) => {
    if (!dom[id]) return;
    const value = dom[id].value;
    dom[id].innerHTML = requiredOptions || `<option value="">Crea un cliente primero</option>`;
    if ([...dom[id].options].some((option) => option.value === value)) dom[id].value = value;
  });

  if (dom.billingFilterClient) dom.billingFilterClient.value = state.billingFilters.clientId;
  if (dom.projectFilterClient) dom.projectFilterClient.value = state.projectFilterClientId;
  if (dom.adminClientFilter) dom.adminClientFilter.value = state.adminFilterClientId;
  if (dom.portalClient) dom.portalClient.value = state.selectedPortalClientId;
  if (dom.crmFilterClient) dom.crmFilterClient.value = state.crmFilters.clientId;
  if (dom.budgetFilterClient) dom.budgetFilterClient.value = state.budgetFilters.clientId;
  if (dom.documentFilterClient) dom.documentFilterClient.value = state.documentFilters.clientId;
  if (dom.supportFilterClient) dom.supportFilterClient.value = state.supportFilters.clientId;
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
    ["actionProject", dom.actionClient?.value],
    ["budgetProject", dom.budgetClient?.value],
    ["calendarEventProject", dom.calendarEventClient?.value],
    ["documentProject", dom.documentClient?.value],
    ["supportProject", dom.supportClient?.value]
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

export function resetOpportunityForm() {
  dom.opportunityForm?.reset();
  if (!dom.opportunityForm) return;
  dom.opportunityId.value = "";
  dom.opportunityCurrency.value = "ARS";
  dom.opportunityProbability.value = 50;
  dom.opportunityFormTitle.textContent = "Nueva oportunidad";
}

export function resetBudgetForm() {
  dom.budgetForm?.reset();
  if (!dom.budgetForm) return;
  dom.budgetId.value = "";
  dom.budgetCurrency.value = "ARS";
  dom.budgetValidUntil.value = toInputDate(new Date(Date.now() + 10 * DAY_MS));
  dom.budgetStatus.value = "borrador";
  dom.budgetFormTitle.textContent = "Nuevo presupuesto";
}

export function resetCalendarEventForm() {
  dom.calendarEventForm?.reset();
  if (!dom.calendarEventForm) return;
  dom.calendarEventId.value = "";
  dom.calendarEventDate.value = toInputDate(new Date());
  dom.calendarEventStart.value = "10:00";
  dom.calendarEventEnd.value = "10:30";
  dom.calendarEventFormTitle.textContent = "Nuevo evento";
}

export function resetDocumentForm() {
  dom.documentForm?.reset();
  if (!dom.documentForm) return;
  dom.documentId.value = "";
  dom.documentFormTitle.textContent = "Nuevo documento";
}

export function resetSupportForm() {
  dom.supportForm?.reset();
  if (!dom.supportForm) return;
  dom.supportId.value = "";
  dom.supportDomainRenewal.value = toInputDate(new Date(Date.now() + 30 * DAY_MS));
  dom.supportHostingRenewal.value = toInputDate(new Date(Date.now() + 30 * DAY_MS));
  dom.supportFormTitle.textContent = "Nuevo mantenimiento";
}

export function resetTeamForm() {
  dom.teamForm?.reset();
  if (!dom.teamForm) return;
  dom.teamId.value = "";
  dom.teamFormTitle.textContent = "Nuevo miembro";
}

export function resetMarketingForm() {
  dom.marketingForm?.reset();
  if (!dom.marketingForm) return;
  dom.marketingId.value = "";
  dom.marketingDate.value = toInputDate(new Date());
  dom.marketingFormTitle.textContent = "Nueva campana";
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

  const budgetRows = budgets().map((budget) => ({
    origin: "Presupuesto",
    title: budget.projectName,
    detail: getClient(budget.clientId)?.company || "",
    amount: budgetTotal(budget),
    currency: budget.currency,
    date: budget.validUntil,
    type: "presupuesto",
    sign: "",
    status: budget.status,
    clientId: budget.clientId
  }));

  const eventRows = calendarEvents().map((event) => ({
    origin: "Calendario",
    title: event.title,
    detail: getClient(event.clientId)?.company || labelize(event.type),
    amount: 0,
    currency: "ARS",
    date: event.date,
    type: "evento",
    sign: "",
    status: event.status,
    clientId: event.clientId
  }));

  return paymentRows.concat(movementRows, taskRows, goalRows, budgetRows, eventRows).sort((a, b) => parseDate(b.date) - parseDate(a.date));
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

function budgetTotal(budget) {
  const subtotal = String(budget.services || "")
    .split("\n")
    .map((line) => Number(line.split(":").pop()))
    .filter((value) => Number.isFinite(value))
    .reduce((total, value) => total + value, 0);
  return Math.max(subtotal - Number(budget.discount || 0), 0);
}

function conversionRate(part, total) {
  return total ? Math.round((Number(part || 0) / Number(total || 1)) * 100) : 0;
}

function matchesTerm(values, term) {
  const value = String(term || "").trim().toLowerCase();
  if (!value) return true;
  return values.filter(Boolean).join(" ").toLowerCase().includes(value);
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

export function escapeAttribute(value) {
  return escapeHTML(value);
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
