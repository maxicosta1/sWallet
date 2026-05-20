import { canDelete, canWrite, login, logout } from "./auth.js";
import { filteredInvoices, projectExists, clientExists } from "./finance.js";
import { createRecord, parseDate, state, toInputDate } from "./state.js";
import { saveState, resetStorage } from "./storage.js";
import {
  closeMobileMenu,
  dom,
  escapeHTML,
  formatARS,
  formatDate,
  formatMoney,
  getClient,
  getInvoice,
  getProject,
  labelize,
  notify,
  renderAll,
  renderView,
  resetActionForm,
  resetBudgetForm,
  resetCalendarEventForm,
  resetClientForm,
  resetDocumentForm,
  resetGoalForm,
  resetInvoiceForm,
  resetMarketingForm,
  resetMovementForm,
  resetNoteForm,
  resetOpportunityForm,
  resetPaymentForm,
  resetProjectForm,
  resetRequestForm,
  resetSupportForm,
  resetSubscriptionForm,
  resetTeamForm,
  resetTaskForm,
  syncControls
} from "./render.js";

export function bindEvents() {
  dom.loginForm.addEventListener("submit", handleLogin);
  dom.logoutButton.addEventListener("click", async () => {
    await logout();
    renderAll();
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => renderView(link.dataset.view));
  });
  document.querySelectorAll(".action-bubble").forEach((button) => {
    button.addEventListener("click", () => renderView(button.dataset.view));
  });
  document.querySelectorAll("[data-view]:not(.nav-link):not(.action-bubble)").forEach((button) => {
    button.addEventListener("click", () => renderView(button.dataset.view));
  });

  prepareModals();
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      resetForModal(button.dataset.openModal);
      openModal(button.dataset.openModal);
    });
  });
  document.querySelector("[data-quick-action='payment']").addEventListener("click", () => {
    renderView("pagos");
    resetPaymentForm();
    openModal("paymentModal");
  });
  dom.menuToggle.addEventListener("click", () => {
    dom.sidebar.classList.add("open");
    dom.mobileBackdrop.classList.add("show");
  });
  dom.mobileBackdrop.addEventListener("click", closeMobileMenu);
  dom.resetDemo.addEventListener("click", () => {
    if (confirm("Esto eliminara usuarios, sesion y datos locales. Continuar?")) resetStorage();
  });

  dom.saveRate.addEventListener("click", saveExchangeRate);
  dom.clientForm.addEventListener("submit", handleClientSubmit);
  dom.paymentForm.addEventListener("submit", handlePaymentSubmit);
  dom.movementForm.addEventListener("submit", handleMovementSubmit);
  dom.projectForm.addEventListener("submit", handleProjectSubmit);
  dom.invoiceForm.addEventListener("submit", handleInvoiceSubmit);
  dom.subscriptionForm.addEventListener("submit", handleSubscriptionSubmit);
  dom.taskForm.addEventListener("submit", handleTaskSubmit);
  dom.goalForm.addEventListener("submit", handleGoalSubmit);
  dom.requestForm.addEventListener("submit", handleRequestSubmit);
  dom.noteForm.addEventListener("submit", handleNoteSubmit);
  dom.actionForm.addEventListener("submit", handleActionSubmit);
  dom.opportunityForm.addEventListener("submit", handleOpportunitySubmit);
  dom.budgetForm.addEventListener("submit", handleBudgetSubmit);
  dom.calendarEventForm.addEventListener("submit", handleCalendarEventSubmit);
  dom.documentForm.addEventListener("submit", handleDocumentSubmit);
  dom.supportForm.addEventListener("submit", handleSupportSubmit);
  dom.teamForm.addEventListener("submit", handleTeamSubmit);
  dom.marketingForm.addEventListener("submit", handleMarketingSubmit);
  if (dom.profilePhotoForm) dom.profilePhotoForm.addEventListener("submit", handleProfilePhotoSubmit);
  if (dom.clearProfilePhoto) dom.clearProfilePhoto.addEventListener("click", clearProfilePhoto);

  dom.cancelClientEdit.addEventListener("click", () => { resetClientForm(); closeModal(); });
  dom.cancelPaymentEdit.addEventListener("click", () => { resetPaymentForm(); closeModal(); });
  dom.cancelProjectEdit.addEventListener("click", () => { resetProjectForm(); closeModal(); });
  dom.cancelInvoiceEdit.addEventListener("click", () => { resetInvoiceForm(); closeModal(); });
  dom.cancelMovementEdit.addEventListener("click", () => { resetMovementForm(); closeModal(); });
  dom.cancelSubscriptionEdit.addEventListener("click", () => { resetSubscriptionForm(); closeModal(); });
  dom.cancelTaskEdit.addEventListener("click", () => { resetTaskForm(); closeModal(); });
  dom.cancelGoalEdit.addEventListener("click", () => { resetGoalForm(); closeModal(); });
  dom.cancelRequestEdit.addEventListener("click", () => { resetRequestForm(); closeModal(); });
  dom.cancelOpportunityEdit.addEventListener("click", () => { resetOpportunityForm(); closeModal(); });
  dom.cancelBudgetEdit.addEventListener("click", () => { resetBudgetForm(); closeModal(); });
  dom.cancelCalendarEventEdit.addEventListener("click", () => { resetCalendarEventForm(); closeModal(); });
  dom.cancelDocumentEdit.addEventListener("click", () => { resetDocumentForm(); closeModal(); });
  dom.cancelSupportEdit.addEventListener("click", () => { resetSupportForm(); closeModal(); });
  dom.cancelTeamEdit.addEventListener("click", () => { resetTeamForm(); closeModal(); });
  dom.cancelMarketingEdit.addEventListener("click", () => { resetMarketingForm(); closeModal(); });
  dom.goCreateClient.addEventListener("click", () => {
    renderView("clientes");
    resetClientForm();
    openModal("clientModal");
  });
  dom.modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  dom.invoiceClient.addEventListener("change", syncControls);
  [dom.taskClient, dom.requestClient, dom.noteClient, dom.actionClient, dom.budgetClient, dom.calendarEventClient, dom.documentClient, dom.supportClient].forEach((control) => control.addEventListener("change", syncControls));
  dom.portalClient.addEventListener("input", () => {
    state.selectedPortalClientId = dom.portalClient.value;
    renderAll();
  });
  dom.paymentInvoice.addEventListener("change", syncPaymentFromInvoice);
  dom.projectFilterClient.addEventListener("input", () => {
    state.projectFilterClientId = dom.projectFilterClient.value;
    renderAll();
  });

  dom.adminClientFilter.addEventListener("input", () => {
    state.adminFilterClientId = dom.adminClientFilter.value;
    renderAll();
  });

  dom.taskFilter.addEventListener("input", () => {
    state.taskFilter = dom.taskFilter.value;
    renderAll();
  });

  dom.globalSearch.addEventListener("input", () => {
    state.globalSearch = dom.globalSearch.value;
    renderAll();
  });

  dom.exportCsv.addEventListener("click", exportCsv);
  dom.printReport.addEventListener("click", printFinancialReport);

  [dom.filterFrom, dom.filterTo, dom.filterClient, dom.filterCurrency, dom.filterStatus].forEach((control) => {
    control.addEventListener("input", () => {
      state.filters = {
        from: dom.filterFrom.value,
        to: dom.filterTo.value,
        clientId: dom.filterClient.value,
        currency: dom.filterCurrency.value,
        status: dom.filterStatus.value
      };
      renderAll();
    });
  });

  [dom.billingFilterClient, dom.billingFilterProject, dom.billingFilterStatus, dom.billingFilterCurrency, dom.billingFilterFrom, dom.billingFilterTo, dom.billingFilterQuick].forEach((control) => {
    control.addEventListener("input", () => {
      state.billingFilters.clientId = dom.billingFilterClient.value;
      if (control === dom.billingFilterClient) state.billingFilters.projectId = "";
      state.billingFilters.projectId = dom.billingFilterProject.value;
      state.billingFilters.status = dom.billingFilterStatus.value;
      state.billingFilters.currency = dom.billingFilterCurrency.value;
      state.billingFilters.from = dom.billingFilterFrom.value;
      state.billingFilters.to = dom.billingFilterTo.value;
      state.billingFilters.quick = dom.billingFilterQuick.value;
      renderAll();
    });
  });

  dom.clearBillingFilters.addEventListener("click", () => {
    state.billingFilters = { clientId: "", projectId: "", status: "", currency: "", from: "", to: "", quick: "" };
    dom.billingFilterClient.value = "";
    dom.billingFilterProject.value = "";
    dom.billingFilterStatus.value = "";
    dom.billingFilterCurrency.value = "";
    dom.billingFilterFrom.value = "";
    dom.billingFilterTo.value = "";
    dom.billingFilterQuick.value = "";
    renderAll();
  });

  dom.clearFilters.addEventListener("click", () => {
    state.filters = { from: "", to: "", clientId: "", currency: "", status: "" };
    dom.filterFrom.value = "";
    dom.filterTo.value = "";
    dom.filterClient.value = "";
    dom.filterCurrency.value = "";
    dom.filterStatus.value = "";
    renderAll();
  });

  window.addEventListener("resize", debounce(renderAll, 150));
  exposeInlineActions();
}

function prepareModals() {
  document.querySelectorAll("[data-modal]").forEach((panel) => {
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-hidden", "true");
    if (!panel.querySelector("[data-close-modal]")) {
      const button = document.createElement("button");
      button.className = "modal-close";
      button.type = "button";
      button.dataset.closeModal = "";
      button.setAttribute("aria-label", "Cerrar modal");
      button.textContent = "x";
      panel.prepend(button);
    }
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });
}

function openModal(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  document.querySelectorAll("[data-modal]").forEach((item) => {
    item.classList.remove("modal-open");
    item.setAttribute("aria-hidden", "true");
  });
  panel.classList.add("modal-open");
  panel.setAttribute("aria-hidden", "false");
  dom.modalBackdrop.hidden = false;
  dom.modalBackdrop.classList.add("show");
  document.body.classList.add("modal-active");
  panel.querySelector("input:not([type='hidden']), select, textarea")?.focus();
}

function closeModal() {
  document.querySelectorAll("[data-modal]").forEach((panel) => {
    panel.classList.remove("modal-open");
    panel.setAttribute("aria-hidden", "true");
  });
  if (dom.modalBackdrop) {
    dom.modalBackdrop.classList.remove("show");
    dom.modalBackdrop.hidden = true;
  }
  document.body.classList.remove("modal-active");
}

function resetForModal(id) {
  const resets = {
    clientModal: resetClientForm,
    paymentModal: resetPaymentForm,
    projectModal: resetProjectForm,
    invoiceModal: resetInvoiceForm,
    movementModal: resetMovementForm,
    subscriptionModal: resetSubscriptionForm,
    taskModal: resetTaskForm,
    goalModal: resetGoalForm,
    requestModal: resetRequestForm,
    noteModal: resetNoteForm,
    actionModal: resetActionForm,
    opportunityModal: resetOpportunityForm,
    budgetModal: resetBudgetForm,
    calendarEventModal: resetCalendarEventForm,
    documentModal: resetDocumentForm,
    supportModal: resetSupportForm,
    teamModal: resetTeamForm,
    marketingModal: resetMarketingForm
  };
  resets[id]?.();
}

async function handleLogin(event) {
  event.preventDefault();
  try {
    setFormBusy(dom.loginForm, true);
    await login({
      credential: dom.loginEmail.value.trim(),
      password: dom.loginPassword.value
    });
    dom.loginError.hidden = true;
    notify("Bienvenido", "Sesion iniciada correctamente.");
    renderAll();
  } catch (error) {
    dom.loginError.textContent = error.message;
    dom.loginError.hidden = false;
  } finally {
    setFormBusy(dom.loginForm, false);
  }
}

function assertWritable() {
  if (!canWrite()) {
    notify("Solo lectura", "Tu rol no permite modificar datos.");
    return false;
  }
  return true;
}

function assertDelete() {
  if (!canDelete()) {
    notify("Permiso requerido", "Solo admin puede eliminar registros.");
    return false;
  }
  return true;
}

async function handleClientSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.clientForm)) return;
  const payload = {
    userId: state.session.userId,
    name: dom.clientName.value.trim(),
    company: dom.clientCompany.value.trim(),
    email: dom.clientEmail.value.trim(),
    phone: dom.clientPhone.value.trim(),
    address: dom.clientAddress.value.trim(),
    socials: dom.clientSocials.value.trim(),
    website: dom.clientWebsite.value.trim(),
    service: dom.clientService.value.trim(),
    amount: Number(dom.clientAmount.value),
    currency: dom.clientCurrency.value,
    status: dom.clientStatus.value,
    priority: dom.clientPriority.value,
    firstContact: dom.clientFirstContact.value,
    lastContact: dom.clientLastContact.value,
    startDate: dom.clientFirstContact.value || new Date().toISOString().slice(0, 10),
    observations: dom.clientObservations.value.trim()
  };
  try {
    setFormBusy(dom.clientForm, true);
    const client = dom.clientId.value
      ? { ...state.clients.find((item) => item.id === dom.clientId.value), ...payload, updatedAt: new Date().toISOString() }
      : createRecord(payload);
    upsertRecord(state.clients, client);
    saveAndRender("Cliente guardado", "Sincronizado con Supabase.");
    resetClientForm();
  } catch (error) {
    notify("No se pudo guardar cliente", error.message);
  } finally {
    setFormBusy(dom.clientForm, false);
  }
}

async function handleProjectSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.projectForm)) return;
  if (!clientExists(dom.projectClient.value)) {
    notify("Cliente obligatorio", "Selecciona un cliente existente para crear el proyecto.");
    return;
  }
  const payload = {
    userId: state.session.userId,
    clientId: dom.projectClient.value,
    name: dom.projectName.value.trim(),
    description: dom.projectDescription.value.trim(),
    budget: Number(dom.projectBudget.value),
    paid: Number(dom.projectPaid.value || 0),
    expenses: Number(dom.projectExpenses.value || 0),
    currency: dom.projectCurrency.value,
    status: dom.projectStatus.value,
    progress: Number(dom.projectProgress.value),
    responsible: dom.projectResponsible.value.trim(),
    technologies: dom.projectTechnologies.value.trim(),
    links: dom.projectLinks.value.trim(),
    startDate: dom.projectStartDate.value,
    dueDate: dom.projectDueDate.value,
    notes: dom.projectNotes.value.trim(),
    tasks: dom.projectTasks.value.split("\n").map((task) => task.trim()).filter(Boolean)
  };
  try {
    setFormBusy(dom.projectForm, true);
    const project = dom.projectId.value
      ? { ...state.projects.find((item) => item.id === dom.projectId.value), ...payload, updatedAt: new Date().toISOString() }
      : createRecord(payload);
    upsertRecord(state.projects, project);
    resetProjectForm();
    saveAndRender("Proyecto guardado", "Sincronizado con Supabase.");
  } catch (error) {
    notify("No se pudo guardar proyecto", error.message);
  } finally {
    setFormBusy(dom.projectForm, false);
  }
}

function handleInvoiceSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.invoiceForm)) return;
  if (!clientExists(dom.invoiceClient.value)) {
    notify("Cliente obligatorio", "No se puede crear una factura sin cliente.");
    return;
  }
  if (dom.invoiceProject.value && !projectExists(dom.invoiceProject.value, dom.invoiceClient.value)) {
    notify("Proyecto invalido", "El proyecto seleccionado no pertenece al cliente.");
    return;
  }
  const payload = {
    userId: state.session.userId,
    clientId: dom.invoiceClient.value,
    projectId: dom.invoiceProject.value,
    number: dom.invoiceNumber.value.trim(),
    amount: Number(dom.invoiceAmount.value),
    currency: dom.invoiceCurrency.value,
    issueDate: dom.invoiceIssueDate.value,
    dueDate: dom.invoiceDueDate.value,
    status: dom.invoiceStatus.value,
    notes: dom.invoiceNotes.value.trim()
  };
  if (dom.invoiceId.value) updateRecord(state.invoices, dom.invoiceId.value, payload);
  else state.invoices.push(createRecord(payload));
  resetInvoiceForm();
  saveAndRender("Factura guardada", "La facturacion fue recalculada.");
}

function handlePaymentSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.paymentForm)) return;
  const invoice = getInvoice(dom.paymentInvoice.value);
  const payload = {
    userId: state.session.userId,
    clientId: invoice?.clientId || dom.paymentClient.value,
    projectId: invoice?.projectId || dom.paymentProject.value || "",
    invoiceId: invoice?.id || "",
    amount: Number(dom.paymentAmount.value),
    currency: dom.paymentCurrency.value,
    date: dom.paymentDate.value,
    dueDate: dom.paymentDueDate.value,
    status: dom.paymentStatus.value,
    method: dom.paymentMethod.value.trim(),
    notes: dom.paymentNotes.value.trim()
  };
  if (!clientExists(payload.clientId)) {
    notify("Cliente obligatorio", "El pago debe estar asociado a un cliente existente.");
    return;
  }
  if (dom.paymentId.value) updateRecord(state.payments, dom.paymentId.value, payload);
  else state.payments.push(createRecord(payload));
  resetPaymentForm();
  saveAndRender("Pago guardado", "La facturacion fue actualizada.");
}

function handleMovementSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.movementForm)) return;
  const payload = {
    userId: state.session.userId,
    type: document.querySelector("input[name='movementType']:checked").value,
    category: dom.movementCategory.value.trim(),
    amount: Number(dom.movementAmount.value),
    currency: dom.movementCurrency.value,
    date: dom.movementDate.value,
    description: dom.movementDescription.value.trim()
  };
  if (dom.movementId.value) updateRecord(state.movements, dom.movementId.value, payload);
  else state.movements.push(createRecord(payload));
  resetMovementForm();
  saveAndRender("Movimiento guardado", "Reportes recalculados.");
}

function handleSubscriptionSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.subscriptionForm)) return;
  const payload = {
    userId: state.session.userId,
    name: dom.subscriptionName.value.trim(),
    provider: dom.subscriptionProvider.value.trim(),
    category: dom.subscriptionCategory.value.trim(),
    monthlyCost: Number(dom.subscriptionMonthly.value),
    annualCost: Number(dom.subscriptionAnnual.value),
    currency: dom.subscriptionCurrency.value,
    renewalDate: dom.subscriptionRenewal.value,
    status: dom.subscriptionStatus.value
  };
  if (dom.subscriptionId.value) updateRecord(state.subscriptions, dom.subscriptionId.value, payload);
  else state.subscriptions.push(createRecord(payload));
  resetSubscriptionForm();
  saveAndRender("Suscripcion guardada", "Renovaciones actualizadas.");
}

function handleTaskSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.taskForm)) return;
  if (!clientExists(dom.taskClient.value)) return notify("Cliente obligatorio", "La tarea debe tener un cliente asociado.");
  if (dom.taskProject.value && !projectExists(dom.taskProject.value, dom.taskClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente seleccionado.");
  const payload = {
    userId: state.session.userId,
    title: dom.taskTitle.value.trim(),
    description: dom.taskDescription.value.trim(),
    clientId: dom.taskClient.value,
    projectId: dom.taskProject.value,
    responsible: dom.taskResponsible.value.trim(),
    priority: dom.taskPriority.value,
    status: dom.taskStatus.value,
    dueDate: dom.taskDueDate.value,
    checklist: dom.taskChecklist.value.split("\n").map((item) => item.trim()).filter(Boolean),
    comments: dom.taskComments.value.trim()
  };
  if (dom.taskId.value) updateRecord(state.tasks, dom.taskId.value, payload);
  else state.tasks.push(createRecord(payload));
  resetTaskForm();
  saveAndRender("Tarea guardada", "El tablero fue actualizado.");
}

function handleGoalSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.goalForm)) return;
  const payload = {
    userId: state.session.userId,
    name: dom.goalName.value.trim(),
    period: dom.goalPeriod.value,
    type: dom.goalType.value,
    target: Number(dom.goalTarget.value),
    current: Number(dom.goalCurrent.value),
    dueDate: dom.goalDueDate.value,
    status: Number(dom.goalCurrent.value) >= Number(dom.goalTarget.value) ? "completada" : "en_progreso"
  };
  if (dom.goalId.value) updateRecord(state.goals, dom.goalId.value, payload);
  else state.goals.push(createRecord(payload));
  resetGoalForm();
  saveAndRender("Meta guardada", "El progreso fue recalculado.");
}

function handleRequestSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.requestForm)) return;
  if (!clientExists(dom.requestClient.value)) return notify("Cliente obligatorio", "El pedido debe pertenecer a un cliente.");
  if (dom.requestProject.value && !projectExists(dom.requestProject.value, dom.requestClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente seleccionado.");
  const payload = {
    userId: state.session.userId,
    clientId: dom.requestClient.value,
    projectId: dom.requestProject.value,
    description: dom.requestDescription.value.trim(),
    type: dom.requestType.value,
    date: dom.requestDate.value,
    status: dom.requestStatus.value,
    priority: dom.requestPriority.value,
    responsible: dom.requestResponsible.value.trim(),
    dueDate: dom.requestDueDate.value,
    notes: dom.requestNotes.value.trim()
  };
  if (dom.requestId.value) updateRecord(state.requests, dom.requestId.value, payload);
  else state.requests.push(createRecord(payload));
  resetRequestForm();
  saveAndRender("Pedido guardado", "Administracion actualizada.");
}

function handleNoteSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.noteForm)) return;
  if (!clientExists(dom.noteClient.value)) return notify("Cliente obligatorio", "La nota debe pertenecer a un cliente.");
  if (dom.noteProject.value && !projectExists(dom.noteProject.value, dom.noteClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente seleccionado.");
  const payload = {
    userId: state.session.userId,
    clientId: dom.noteClient.value,
    projectId: dom.noteProject.value,
    title: dom.noteTitle.value.trim(),
    content: dom.noteContent.value.trim(),
    tone: dom.noteTone.value,
    date: new Date().toISOString().slice(0, 10)
  };
  if (dom.noteId.value) updateRecord(state.notes, dom.noteId.value, payload);
  else state.notes.push(createRecord(payload));
  resetNoteForm();
  saveAndRender("Nota guardada", "La ficha interna fue actualizada.");
}

function handleActionSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.actionForm)) return;
  if (!clientExists(dom.actionClient.value)) return notify("Cliente obligatorio", "La accion debe pertenecer a un cliente.");
  if (dom.actionProject.value && !projectExists(dom.actionProject.value, dom.actionClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente seleccionado.");
  const payload = {
    userId: state.session.userId,
    clientId: dom.actionClient.value,
    projectId: dom.actionProject.value,
    title: dom.actionTitle.value.trim(),
    dueDate: dom.actionDueDate.value,
    priority: dom.actionPriority.value,
    status: dom.actionStatus.value
  };
  if (dom.actionId.value) updateRecord(state.actions, dom.actionId.value, payload);
  else state.actions.push(createRecord(payload));
  resetActionForm();
  saveAndRender("Accion guardada", "Seguimiento actualizado.");
}

function handleOpportunitySubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.opportunityForm)) return;
  if (!clientExists(dom.opportunityClient.value)) return notify("Cliente obligatorio", "La oportunidad debe estar asociada a un cliente.");
  const payload = {
    userId: state.session.userId,
    clientId: dom.opportunityClient.value,
    title: dom.opportunityTitle.value.trim(),
    service: dom.opportunityService.value.trim(),
    value: Number(dom.opportunityValue.value),
    currency: dom.opportunityCurrency.value,
    probability: Number(dom.opportunityProbability.value),
    status: dom.opportunityStatus.value,
    nextAction: dom.opportunityNextAction.value.trim(),
    responsible: dom.opportunityResponsible.value.trim(),
    notes: dom.opportunityNotes.value.trim()
  };
  if (dom.opportunityId.value) updateRecord(state.opportunities, dom.opportunityId.value, payload);
  else state.opportunities.push(createRecord(payload));
  resetOpportunityForm();
  saveAndRender("Oportunidad guardada", "Pipeline comercial actualizado.");
}

function handleBudgetSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.budgetForm)) return;
  if (dom.budgetClient.value && !clientExists(dom.budgetClient.value)) return notify("Cliente invalido", "Selecciona un cliente existente o deja el presupuesto sin asociar.");
  const issueDate = dom.budgetIssueDate?.value || toInputDate(new Date());
  const payload = {
    userId: state.session.userId,
    clientId: dom.budgetClient.value,
    number: dom.budgetNumber?.value.trim() || nextLocalBudgetNumber(),
    projectName: dom.budgetProjectName.value.trim(),
    services: dom.budgetServices.value.trim(),
    discount: Number(dom.budgetDiscount.value || 0),
    taxes: Number(dom.budgetTaxes?.value || 0),
    currency: dom.budgetCurrency.value,
    issueDate,
    validUntil: dom.budgetValidUntil.value,
    status: dom.budgetStatus.value,
    notes: dom.budgetNotes.value.trim()
  };
  if (dom.budgetId.value) updateRecord(state.budgets, dom.budgetId.value, payload);
  else state.budgets.push(createRecord(payload));
  resetBudgetForm();
  saveAndRender("Presupuesto guardado", "La propuesta quedo registrada.");
}

function handleCalendarEventSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.calendarEventForm)) return;
  if (dom.calendarEventClient.value && !clientExists(dom.calendarEventClient.value)) return notify("Cliente invalido", "Selecciona un cliente existente.");
  if (dom.calendarEventProject.value && !projectExists(dom.calendarEventProject.value, dom.calendarEventClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente.");
  const payload = {
    userId: state.session.userId,
    title: dom.calendarEventTitle.value.trim(),
    type: dom.calendarEventType.value,
    date: dom.calendarEventDate.value,
    startTime: dom.calendarEventStart.value,
    endTime: dom.calendarEventEnd.value,
    clientId: dom.calendarEventClient.value,
    projectId: dom.calendarEventProject.value,
    status: dom.calendarEventStatus.value,
    priority: dom.calendarEventPriority.value,
    description: dom.calendarEventDescription.value.trim()
  };
  if (dom.calendarEventId.value) updateRecord(state.calendarEvents, dom.calendarEventId.value, payload);
  else state.calendarEvents.push(createRecord(payload));
  resetCalendarEventForm();
  saveAndRender("Evento guardado", "Calendario actualizado.");
}

function handleDocumentSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.documentForm)) return;
  if (dom.documentProject.value && !projectExists(dom.documentProject.value, dom.documentClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente seleccionado.");
  const payload = {
    userId: state.session.userId,
    name: dom.documentName.value.trim(),
    type: dom.documentType.value.trim(),
    clientId: dom.documentClient.value,
    projectId: dom.documentProject.value,
    link: dom.documentLink.value.trim(),
    tags: dom.documentTags.value.trim(),
    description: dom.documentDescription.value.trim()
  };
  if (dom.documentId.value) updateRecord(state.documents, dom.documentId.value, payload);
  else state.documents.push(createRecord(payload));
  resetDocumentForm();
  saveAndRender("Documento guardado", "Biblioteca actualizada.");
}

function handleSupportSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.supportForm)) return;
  if (!clientExists(dom.supportClient.value)) return notify("Cliente obligatorio", "El mantenimiento debe tener cliente.");
  if (dom.supportProject.value && !projectExists(dom.supportProject.value, dom.supportClient.value)) return notify("Proyecto invalido", "El proyecto no pertenece al cliente.");
  const payload = {
    userId: state.session.userId,
    clientId: dom.supportClient.value,
    projectId: dom.supportProject.value,
    url: dom.supportUrl.value.trim(),
    domain: dom.supportDomain.value.trim(),
    hosting: dom.supportHosting.value.trim(),
    domainRenewal: dom.supportDomainRenewal.value,
    hostingRenewal: dom.supportHostingRenewal.value,
    plan: dom.supportPlan.value.trim(),
    monthlyPrice: Number(dom.supportMonthlyPrice.value),
    currency: dom.supportCurrency.value,
    status: dom.supportStatus.value,
    notes: dom.supportNotes.value.trim()
  };
  if (dom.supportId.value) updateRecord(state.supportPlans, dom.supportId.value, payload);
  else state.supportPlans.push(createRecord(payload));
  resetSupportForm();
  saveAndRender("Mantenimiento guardado", "Soporte actualizado.");
}

function handleTeamSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.teamForm)) return;
  const payload = {
    userId: state.session.userId,
    name: dom.teamName.value.trim(),
    email: dom.teamEmail.value.trim(),
    role: dom.teamRole.value.trim(),
    status: dom.teamStatus.value,
    focus: dom.teamFocus.value.trim()
  };
  if (dom.teamId.value) updateRecord(state.teamMembers, dom.teamId.value, payload);
  else state.teamMembers.push(createRecord(payload));
  resetTeamForm();
  saveAndRender("Miembro guardado", "Equipo actualizado.");
}

function handleMarketingSubmit(event) {
  event.preventDefault();
  if (!assertWritable() || !validateForm(dom.marketingForm)) return;
  const payload = {
    userId: state.session.userId,
    name: dom.marketingName.value.trim(),
    target: dom.marketingTarget.value.trim(),
    message: dom.marketingMessage.value.trim(),
    contacts: Number(dom.marketingContacts.value || 0),
    responses: Number(dom.marketingResponses.value || 0),
    meetings: Number(dom.marketingMeetings.value || 0),
    sales: Number(dom.marketingSales.value || 0),
    status: dom.marketingStatus.value,
    date: dom.marketingDate.value
  };
  if (dom.marketingId.value) updateRecord(state.marketingCampaigns, dom.marketingId.value, payload);
  else state.marketingCampaigns.push(createRecord(payload));
  resetMarketingForm();
  saveAndRender("Campana guardada", "Marketing actualizado.");
}

async function handleProfilePhotoSubmit(event) {
  event.preventDefault();
  if (!assertWritable()) return;
  try {
    setFormBusy(dom.profilePhotoForm, true);
    const avatar = dom.profilePhotoFile?.files?.[0]
      ? await readProfilePhoto(dom.profilePhotoFile.files[0])
      : dom.profilePhotoUrl.value.trim();
    updateCurrentUserProfile({ avatar });
    saveAndRender("Foto actualizada", "Tu perfil fue actualizado.");
  } catch (error) {
    notify("No se pudo guardar la foto", error.message);
  } finally {
    setFormBusy(dom.profilePhotoForm, false);
  }
}

function clearProfilePhoto() {
  if (!assertWritable()) return;
  dom.profilePhotoUrl.value = "";
  if (dom.profilePhotoFile) dom.profilePhotoFile.value = "";
  updateCurrentUserProfile({ avatar: "" });
  saveAndRender("Foto eliminada", "Tu perfil vuelve a usar iniciales.");
}

function readProfilePhoto(file) {
  const maxSize = 900 * 1024;
  if (!file.type.startsWith("image/")) throw new Error("Selecciona una imagen valida.");
  if (file.size > maxSize) throw new Error("La imagen debe pesar menos de 900 KB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("No se pudo leer la imagen.")));
    reader.readAsDataURL(file);
  });
}

function updateCurrentUserProfile(payload) {
  if (!state.session?.userId) return;
  const user = state.users.find((item) => item.id === state.session.userId);
  if (!user) return;
  const username = String(user.username || "").toLowerCase();
  state.userProfiles = state.userProfiles || {};
  if (user.username) {
    state.userProfiles[user.username] = { ...(state.userProfiles[user.username] || {}), ...payload };
  }
  if (username) {
    state.userProfiles[username] = { ...(state.userProfiles[username] || {}), ...payload };
  }
  state.userProfiles[user.id] = { ...(state.userProfiles[user.id] || {}), ...payload };
  updateRecord(state.users, state.session.userId, payload);
}

function saveExchangeRate() {
  if (!assertWritable()) return;
  const value = Number(dom.exchangeRate.value);
  if (!value || value <= 0) {
    notify("Cotizacion invalida", "Ingresa un valor mayor a cero.");
    return;
  }
  state.exchangeRate = value;
  saveAndRender("Cotizacion actualizada", `1 USD = ${value} ARS.`);
}

function syncPaymentFromInvoice() {
  const invoice = getInvoice(dom.paymentInvoice.value);
  if (!invoice) return;
  dom.paymentClient.value = invoice.clientId;
  dom.paymentProject.value = invoice.projectId || "";
  dom.paymentAmount.value = invoice.amount;
  dom.paymentCurrency.value = invoice.currency;
  dom.paymentDueDate.value = invoice.dueDate;
}

function validateForm(form) {
  form.querySelectorAll(".field-error").forEach((control) => control.classList.remove("field-error"));
  const invalid = [...form.querySelectorAll("[required]")].filter((control) => !String(control.value || "").trim());
  invalid.forEach((control) => control.classList.add("field-error"));
  if (invalid.length) {
    notify("Campos incompletos", "Completa los campos marcados para continuar.");
    invalid[0].focus();
    return false;
  }
  return true;
}

function updateRecord(collection, id, payload) {
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) return;
  collection[index] = { ...collection[index], ...payload, updatedAt: new Date().toISOString() };
}

function upsertRecord(collection, record) {
  const index = collection.findIndex((item) => item.id === record.id);
  if (index === -1) collection.unshift(record);
  else collection[index] = record;
}

function saveAndRender(title, message) {
  closeModal();
  saveState();
  renderAll();
  notify(title, message);
}

function exportCsv() {
  const userId = state.session.userId;
  const rows = [
    ["tipo", "titulo", "clienteId", "proyectoId", "monto", "moneda", "estado", "fecha"],
    ...state.invoices.filter((item) => item.userId === userId).map((item) => ["factura", item.number, item.clientId, item.projectId, item.amount, item.currency, item.status, item.issueDate]),
    ...state.payments.filter((item) => item.userId === userId).map((item) => ["pago", item.method, item.clientId, item.projectId, item.amount, item.currency, item.status, item.date]),
    ...state.movements.filter((item) => item.userId === userId).map((item) => [item.type, item.category, "", "", item.amount, item.currency, "", item.date]),
    ...state.tasks.filter((item) => item.userId === userId).map((item) => ["tarea", item.title, item.clientId, item.projectId, "", "", item.status, item.dueDate]),
    ...state.goals.filter((item) => item.userId === userId).map((item) => ["meta", item.name, "", "", item.current, item.type, item.status, item.dueDate]),
    ...state.opportunities.filter((item) => item.userId === userId).map((item) => ["oportunidad", item.title, item.clientId, "", item.value, item.currency, item.status, item.createdAt]),
    ...state.budgets.filter((item) => item.userId === userId).map((item) => ["presupuesto", item.projectName, item.clientId, "", budgetTotal(item), item.currency, item.status, item.validUntil]),
    ...state.calendarEvents.filter((item) => item.userId === userId).map((item) => ["evento", item.title, item.clientId, item.projectId, "", "", item.status, item.date])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `swallet-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  notify("CSV generado", "Reporte exportado correctamente.");
}

function exposeInlineActions() {
  window.showClientDetail = (id) => {
    state.selectedClientId = state.selectedClientId === id ? "" : id;
    renderAll();
  };
  window.toggleBillingDetail = (id) => {
    state.selectedBillingClientId = state.selectedBillingClientId === id ? "" : id;
    renderAll();
  };
  window.editClient = (id) => editGeneric("clients", id, fillClientForm);
  window.deleteClient = deleteClient;
  window.editProject = (id) => editGeneric("projects", id, fillProjectForm);
  window.deleteProject = deleteProject;
  window.editInvoice = (id) => editGeneric("invoices", id, fillInvoiceForm);
  window.printInvoice = printInvoice;
  window.deleteInvoice = (id) => deleteGeneric("invoices", id, "Factura eliminada");
  window.editPayment = (id) => editGeneric("payments", id, fillPaymentForm);
  window.printPayment = printPayment;
  window.deletePayment = (id) => deleteGeneric("payments", id, "Pago eliminado");
  window.editMovement = (id) => editGeneric("movements", id, fillMovementForm);
  window.deleteMovement = (id) => deleteGeneric("movements", id, "Movimiento eliminado");
  window.editSubscription = (id) => editGeneric("subscriptions", id, fillSubscriptionForm);
  window.deleteSubscription = (id) => deleteGeneric("subscriptions", id, "Suscripcion eliminada");
  window.editTask = (id) => editGeneric("tasks", id, fillTaskForm);
  window.deleteTask = (id) => deleteGeneric("tasks", id, "Tarea eliminada");
  window.editGoal = (id) => editGeneric("goals", id, fillGoalForm);
  window.deleteGoal = (id) => deleteGeneric("goals", id, "Meta eliminada");
  window.editRequest = (id) => editGeneric("requests", id, fillRequestForm);
  window.deleteRequest = (id) => deleteGeneric("requests", id, "Pedido eliminado");
  window.editNote = (id) => editGeneric("notes", id, fillNoteForm);
  window.deleteNote = (id) => deleteGeneric("notes", id, "Nota eliminada");
  window.editAction = (id) => editGeneric("actions", id, fillActionForm);
  window.deleteAction = (id) => deleteGeneric("actions", id, "Accion eliminada");
  window.editOpportunity = (id) => editGeneric("opportunities", id, fillOpportunityForm);
  window.deleteOpportunity = (id) => deleteGeneric("opportunities", id, "Oportunidad eliminada");
  window.editBudget = (id) => editGeneric("budgets", id, fillBudgetForm);
  window.printBudget = printBudget;
  window.deleteBudget = (id) => deleteGeneric("budgets", id, "Presupuesto eliminado");
  window.duplicateBudget = duplicateBudget;
  window.convertBudgetToProject = convertBudgetToProject;
  window.editCalendarEvent = (id) => editGeneric("calendarEvents", id, fillCalendarEventForm);
  window.deleteCalendarEvent = (id) => deleteGeneric("calendarEvents", id, "Evento eliminado");
  window.editDocument = (id) => editGeneric("documents", id, fillDocumentForm);
  window.printDocument = printDocument;
  window.deleteDocument = (id) => deleteGeneric("documents", id, "Documento eliminado");
  window.editSupportPlan = (id) => editGeneric("supportPlans", id, fillSupportForm);
  window.deleteSupportPlan = (id) => deleteGeneric("supportPlans", id, "Mantenimiento eliminado");
  window.editTeamMember = (id) => editGeneric("teamMembers", id, fillTeamForm);
  window.deleteTeamMember = (id) => deleteGeneric("teamMembers", id, "Miembro eliminado");
  window.editMarketingCampaign = (id) => editGeneric("marketingCampaigns", id, fillMarketingForm);
  window.deleteMarketingCampaign = (id) => deleteGeneric("marketingCampaigns", id, "Campana eliminada");
  window.printFinancialReport = printFinancialReport;
  window.goSearchResult = (view) => {
    state.globalSearch = "";
    renderView(view);
    renderAll();
  };
};

function printInvoice(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return notify("No se encontro la factura", "El registro ya no esta disponible.");
  const client = getClient(invoice.clientId);
  const project = getProject(invoice.projectId);
  const paid = state.payments
    .filter((payment) => payment.invoiceId === invoice.id && payment.status === "pagado")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const pending = Math.max(Number(invoice.amount || 0) - paid, 0);

  openPrintSheet({
    type: "FACTURA",
    number: invoice.number,
    title: project?.name || client?.service || "Servicios sCode",
    client,
    meta: [
      ["Fecha de emision", formatDate(invoice.issueDate)],
      ["Fecha de vencimiento", formatDate(invoice.dueDate)],
      ["Estado", labelize(invoice.status)],
      ["Moneda", invoice.currency]
    ],
    rows: [[project?.name || client?.service || "Servicio profesional", invoice.notes || "Servicio facturado", "1", formatMoney(invoice.amount, invoice.currency), formatMoney(invoice.amount, invoice.currency)]],
    totals: [
      ["Subtotal", formatMoney(invoice.amount, invoice.currency)],
      ["Pagado", formatMoney(paid, invoice.currency)],
      ["Saldo pendiente", formatMoney(pending, invoice.currency)]
    ],
    notes: invoice.notes || "Comprobante generado desde sWallet."
  });
}

function printPayment(id) {
  const payment = state.payments.find((item) => item.id === id);
  if (!payment) return notify("No se encontro el pago", "El registro ya no esta disponible.");
  const client = getClient(payment.clientId);
  const project = getProject(payment.projectId);
  const invoice = getInvoice(payment.invoiceId);

  openPrintSheet({
    type: "COMPROBANTE DE PAGO",
    number: payment.id.slice(0, 8).toUpperCase(),
    title: payment.method || "Pago registrado",
    client,
    meta: [
      ["Fecha", formatDate(payment.date)],
      ["Factura asociada", invoice?.number || "Sin factura"],
      ["Proyecto", project?.name || "General"],
      ["Estado", labelize(payment.status)]
    ],
    rows: [["Pago recibido", payment.notes || payment.method || "Pago", "1", formatMoney(payment.amount, payment.currency), formatMoney(payment.amount, payment.currency)]],
    totals: [["Total pagado", formatMoney(payment.amount, payment.currency)]],
    notes: payment.notes || "Comprobante interno de pago registrado en sWallet."
  });
}

function printBudget(id) {
  const budget = state.budgets.find((item) => item.id === id);
  if (!budget) return notify("No se encontro el presupuesto", "El registro ya no esta disponible.");
  const client = getClient(budget.clientId);
  const items = budgetItems(budget);
  const subtotal = items.reduce((total, item) => total + item.amount, 0);
  const total = budgetTotal(budget);

  openPrintSheet({
    type: "PRESUPUESTO",
    number: budget.number || budget.id.slice(0, 8).toUpperCase(),
    title: budget.projectName,
    client,
    meta: [
      ["Emision", formatDate(budget.issueDate || budget.createdAt)],
      ["Valido hasta", formatDate(budget.validUntil)],
      ["Estado", labelize(budget.status)],
      ["Moneda", budget.currency],
      ["Servicios", `${items.length} items`]
    ],
    rows: items.map((item, index) => [String(index + 1), item.name, String(item.quantity), formatMoney(item.unitPrice, budget.currency), formatMoney(item.amount, budget.currency)]),
    totals: [
      ["Subtotal", formatMoney(subtotal, budget.currency)],
      ["Descuento", formatMoney(Number(budget.discount || 0), budget.currency)],
      ["Impuestos", formatMoney(Number(budget.taxes || 0), budget.currency)],
      ["Total", formatMoney(total, budget.currency)]
    ],
    notes: budget.notes || "Presupuesto valido hasta la fecha indicada. Los cambios fuera de alcance se presupuestan aparte."
  });
}

function printDocument(id) {
  const documentItem = state.documents.find((item) => item.id === id);
  if (!documentItem) return notify("No se encontro el documento", "El registro ya no esta disponible.");
  const client = getClient(documentItem.clientId);
  const project = getProject(documentItem.projectId);

  openPrintSheet({
    type: labelize(documentItem.type || "DOCUMENTO").toUpperCase(),
    number: documentItem.id.slice(0, 8).toUpperCase(),
    title: documentItem.name,
    client,
    meta: [
      ["Proyecto", project?.name || "General"],
      ["Tipo", labelize(documentItem.type || "documento")],
      ["Etiquetas", documentItem.tags || "Sin etiquetas"],
      ["Fecha", formatDate(documentItem.createdAt)]
    ],
    rows: [["Documento", documentItem.description || "Documento interno", "1", "-", "-"]],
    totals: [],
    notes: documentItem.link ? `Link asociado: ${documentItem.link}` : "Documento generado desde sWallet."
  });
}

function printFinancialReport() {
  const income = state.payments.filter((payment) => payment.status === "pagado").reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const expenses = state.movements.filter((item) => item.type === "salida").reduce((total, item) => total + Number(item.amount || 0), 0);
  const pending = filteredInvoices({}).reduce((total, invoice) => total + Number(invoice.amount || 0), 0);

  openPrintSheet({
    type: "REPORTE",
    number: new Date().toISOString().slice(0, 10),
    title: "Resumen financiero sWallet",
    client: null,
    meta: [
      ["Clientes", String(state.clients.length)],
      ["Proyectos", String(state.projects.length)],
      ["Facturas", String(state.invoices.length)],
      ["Pagos", String(state.payments.length)]
    ],
    rows: [
      ["Ingresos cobrados", "Pagos marcados como pagados", "1", formatARS(income), formatARS(income)],
      ["Egresos", "Movimientos de salida", "1", formatARS(expenses), formatARS(expenses)],
      ["Facturado", "Facturas registradas", "1", formatARS(pending), formatARS(pending)]
    ],
    totals: [["Resultado estimado", formatARS(income - expenses)]],
    notes: "Reporte operativo generado desde sWallet."
  });
}

function budgetItems(budget) {
  const rows = String(budget.services || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(":");
      const unitPrice = Number(parts.pop());
      const maybeQuantity = Number(parts[parts.length - 1]);
      const hasQuantity = parts.length > 1 && Number.isFinite(maybeQuantity);
      const quantity = hasQuantity ? maybeQuantity : 1;
      if (hasQuantity) parts.pop();
      const amount = quantity * unitPrice;
      return {
        name: parts.join(":").trim() || line,
        quantity,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
        amount: Number.isFinite(amount) ? amount : 0
      };
    })
    .filter((item) => item.name || item.amount);
  return rows.length ? rows : [{ name: budget.projectName || "Servicio sCode", quantity: 1, unitPrice: 0, amount: 0 }];
}

function openPrintSheet({ type, number, title, client, meta, rows, totals, notes }) {
  const company = state.companySettings || {};
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return notify("No se pudo abrir la hoja", "Habilita ventanas emergentes para imprimir.");
  const rowsHtml = rows.map((row) => `
    <tr>${row.map((cell) => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>
  `).join("");
  const totalsHtml = totals.map(([label, value]) => `
    <div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>
  `).join("");
  const metaHtml = meta.map(([label, value]) => `
    <div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || "-")}</strong></div>
  `).join("");
  const clientHtml = client ? `
    <section class="sheet-client">
      <div><span>Cliente</span><strong>${escapeHTML(client.company || client.name)}</strong></div>
      <div><span>Contacto</span><strong>${escapeHTML(client.name || "-")}</strong></div>
      <div><span>Email</span><strong>${escapeHTML(client.email || "-")}</strong></div>
      <div><span>Telefono</span><strong>${escapeHTML(client.phone || "-")}</strong></div>
    </section>
  ` : "";

  win.document.write(`<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHTML(type)} ${escapeHTML(number || "")}</title>
        <style>${printSheetStyles()}</style>
      </head>
      <body>
        <main class="sheet">
          <header class="sheet-header">
            <section>
              <div class="brand-lockup"><span>s</span><div><strong>${escapeHTML(company.name || "sCode")}</strong><small>${escapeHTML(company.legalName || "Digital Solutions")}</small></div></div>
              <p>${escapeHTML(company.email || "admin@scode.com")}<br>${escapeHTML(company.website || "scode.com")}</p>
            </section>
            <section class="sheet-title">
              <b>${escapeHTML(type)}</b>
              <strong>${escapeHTML(number || "-")}</strong>
              <span>Emitido ${escapeHTML(formatDate(new Date()))}</span>
            </section>
          </header>
          <h1>${escapeHTML(title)}</h1>
          ${clientHtml}
          <section class="sheet-meta">${metaHtml}</section>
          <table>
            <thead><tr><th>Codigo</th><th>Descripcion</th><th>Cant.</th><th>Unitario</th><th>Importe</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <section class="sheet-bottom">
            <p>${escapeHTML(notes || "")}</p>
            <div class="sheet-totals">${totalsHtml}</div>
          </section>
          <footer>
            <span>Documento generado con sWallet</span>
            <strong>${escapeHTML(company.name || "sCode Digital Solutions")}</strong>
          </footer>
        </main>
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
      </body>
    </html>`);
  win.document.close();
}

function printSheetStyles() {
  return `
    *{box-sizing:border-box} body{margin:0;background:#1b1b22;color:#111;font-family:Arial,Helvetica,sans-serif} .sheet{width:210mm;min-height:297mm;margin:0 auto;padding:14mm;background:#fff} .sheet-header{display:grid;grid-template-columns:1fr 1fr;border:2px solid #111} .sheet-header>section{min-height:42mm;padding:8mm}.sheet-header>section+section{border-left:2px solid #111}.brand-lockup{display:flex;gap:12px;align-items:center}.brand-lockup span{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#9f5cff;color:#fff;font-size:28px;font-weight:900}.brand-lockup strong{display:block;font-size:20px}.brand-lockup small,.sheet-header p,.sheet-title span{color:#444}.sheet-title b{display:block;font-size:30px;letter-spacing:.03em}.sheet-title strong{display:block;margin-top:8px;font-size:18px}h1{font-size:22px;margin:8mm 0 5mm}.sheet-client,.sheet-meta{display:grid;grid-template-columns:repeat(2,1fr);border:2px solid #111;border-top:0}.sheet-client div,.sheet-meta div{padding:7px 9px;border-top:1px solid #bbb}.sheet-client div:nth-child(odd),.sheet-meta div:nth-child(odd){border-right:1px solid #bbb}span{font-size:11px;text-transform:uppercase;color:#555;font-weight:700}strong{font-size:13px}table{width:100%;margin-top:5mm;border-collapse:collapse;border:2px solid #111}th{background:#eee;border-bottom:2px solid #111;font-size:12px;text-align:left;padding:7px}td{font-size:12px;padding:7px;border-bottom:1px solid #ddd}td:nth-child(1),td:nth-child(3),td:nth-child(4),td:nth-child(5){text-align:right}.sheet-bottom{display:grid;grid-template-columns:1fr 70mm;gap:10mm;margin-top:70mm;border:2px solid #111;padding:8mm}.sheet-bottom p{margin:0;font-size:12px;line-height:1.5}.sheet-totals{display:grid;gap:8px}.sheet-totals div{display:flex;justify-content:space-between;gap:16px}.sheet-totals div:last-child{padding-top:8px;border-top:2px solid #111}.sheet-totals div:last-child strong{font-size:18px}footer{display:flex;justify-content:space-between;margin-top:8mm;padding-top:5mm;border-top:1px solid #111;font-size:11px;color:#555}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none}@page{size:A4;margin:0}}`;
}

function editGeneric(key, id, fill) {
  if (!assertWritable()) return;
  const item = state[key].find((record) => record.id === id);
  if (item) fill(item);
}

function deleteGeneric(key, id, message) {
  if (!assertDelete()) return;
  if (!confirm("Confirmas eliminar este registro?")) return;
  state[key] = state[key].filter((record) => record.id !== id);
  saveAndRender(message, "Los datos fueron actualizados.");
}

async function deleteClient(id) {
  if (!assertDelete()) return;
  if (!confirm("Confirmas eliminar este registro?")) return;
  state.clients = state.clients.filter((record) => record.id !== id);
  saveAndRender("Cliente eliminado", "Supabase fue actualizado.");
}

async function deleteProject(id) {
  if (!assertDelete()) return;
  if (!confirm("Confirmas eliminar este registro?")) return;
  state.projects = state.projects.filter((record) => record.id !== id);
  saveAndRender("Proyecto eliminado", "Supabase fue actualizado.");
}

function setFormBusy(form, busy) {
  form.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = busy;
  });
}

function duplicateBudget(id) {
  if (!assertWritable()) return;
  const budget = state.budgets.find((item) => item.id === id);
  if (!budget) return;
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...copy } = budget;
  state.budgets.push(createRecord({
    ...copy,
    number: nextLocalBudgetNumber(),
    projectName: `${budget.projectName} copia`,
    status: "borrador"
  }));
  saveAndRender("Presupuesto duplicado", "Se creo una copia editable.");
}

function convertBudgetToProject(id) {
  if (!assertWritable()) return;
  const budget = state.budgets.find((item) => item.id === id);
  if (!budget || !clientExists(budget.clientId)) return notify("No se pudo convertir", "El presupuesto no tiene un cliente valido.");
  state.projects.push(createRecord({
    userId: state.session.userId,
    clientId: budget.clientId,
    name: budget.projectName,
    description: budget.notes || "Proyecto creado desde presupuesto.",
    budget: budgetTotal(budget),
    paid: 0,
    expenses: 0,
    currency: budget.currency,
    status: "planificacion",
    progress: 0,
    responsible: "",
    technologies: "",
    links: "",
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    notes: budget.services,
    tasks: []
  }));
  updateRecord(state.budgets, id, { status: "aprobado" });
  saveAndRender("Proyecto creado", "El presupuesto aprobado paso a delivery.");
}

function budgetTotal(budget) {
  const subtotal = budgetItems(budget).reduce((total, item) => total + item.amount, 0);
  return Math.max(subtotal - Number(budget.discount || 0) + Number(budget.taxes || 0), 0);
}

function nextLocalBudgetNumber() {
  const next = state.budgets
    .map((budget) => Number(String(budget.number || "").replace("PRE-", "")))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `PRE-${String(next).padStart(6, "0")}`;
}

function fillClientForm(client) {
  dom.clientId.value = client.id;
  dom.clientName.value = client.name;
  dom.clientCompany.value = client.company;
  dom.clientEmail.value = client.email;
  dom.clientPhone.value = client.phone;
  dom.clientAddress.value = client.address || "";
  dom.clientSocials.value = client.socials || "";
  dom.clientWebsite.value = client.website || "";
  dom.clientService.value = client.service;
  dom.clientAmount.value = client.amount;
  dom.clientCurrency.value = client.currency;
  dom.clientStatus.value = ({ activo: "cliente_activo", pendiente: "en_negociacion", finalizado: "proyecto_finalizado" }[client.status]) || client.status || "lead";
  dom.clientPriority.value = client.priority || "media";
  dom.clientFirstContact.value = client.firstContact || client.startDate || "";
  dom.clientLastContact.value = client.lastContact || "";
  dom.clientObservations.value = client.observations || "";
  dom.clientFormTitle.textContent = "Editar cliente";
  renderView("clientes");
  openModal("clientModal");
}

function fillProjectForm(project) {
  dom.projectId.value = project.id;
  dom.projectClient.value = project.clientId;
  dom.projectName.value = project.name;
  dom.projectDescription.value = project.description || "";
  dom.projectBudget.value = project.budget;
  dom.projectPaid.value = project.paid || "";
  dom.projectExpenses.value = project.expenses || "";
  dom.projectCurrency.value = project.currency;
  dom.projectStatus.value = ({ pendiente: "planificacion", en_progreso: "en_desarrollo", revision: "en_revision", entregado: "finalizado", pausado: "esperando_cliente" }[project.status]) || project.status || "planificacion";
  dom.projectProgress.value = project.progress;
  dom.projectResponsible.value = project.responsible || "";
  dom.projectTechnologies.value = project.technologies || "";
  dom.projectLinks.value = project.links || "";
  dom.projectStartDate.value = project.startDate || "";
  dom.projectDueDate.value = project.dueDate || "";
  dom.projectNotes.value = project.notes || "";
  dom.projectTasks.value = (project.tasks || []).join("\n");
  dom.projectFormTitle.textContent = "Editar proyecto";
  renderView("proyectos");
  openModal("projectModal");
}

function fillInvoiceForm(invoice) {
  dom.invoiceId.value = invoice.id;
  dom.invoiceClient.value = invoice.clientId;
  syncControls();
  dom.invoiceProject.value = invoice.projectId || "";
  dom.invoiceNumber.value = invoice.number;
  dom.invoiceAmount.value = invoice.amount;
  dom.invoiceCurrency.value = invoice.currency;
  dom.invoiceIssueDate.value = invoice.issueDate;
  dom.invoiceDueDate.value = invoice.dueDate;
  dom.invoiceStatus.value = invoice.status;
  dom.invoiceNotes.value = invoice.notes || "";
  dom.invoiceFormTitle.textContent = "Editar factura";
  renderView("facturacion");
  openModal("invoiceModal");
}

function fillPaymentForm(payment) {
  dom.paymentId.value = payment.id;
  dom.paymentClient.value = payment.clientId;
  dom.paymentInvoice.value = payment.invoiceId || "";
  dom.paymentProject.value = payment.projectId || "";
  dom.paymentAmount.value = payment.amount;
  dom.paymentCurrency.value = payment.currency;
  dom.paymentDate.value = payment.date;
  dom.paymentDueDate.value = payment.dueDate || "";
  dom.paymentStatus.value = payment.status;
  dom.paymentMethod.value = payment.method;
  dom.paymentNotes.value = payment.notes || "";
  dom.paymentFormTitle.textContent = "Editar pago";
  renderView("pagos");
  openModal("paymentModal");
}

function fillMovementForm(item) {
  dom.movementId.value = item.id;
  document.querySelector(`input[name='movementType'][value='${item.type}']`).checked = true;
  dom.movementCategory.value = item.category;
  dom.movementAmount.value = item.amount;
  dom.movementCurrency.value = item.currency;
  dom.movementDate.value = item.date;
  dom.movementDescription.value = item.description;
  dom.movementFormTitle.textContent = "Editar movimiento";
  renderView("movimientos");
  openModal("movementModal");
}

function fillSubscriptionForm(item) {
  dom.subscriptionId.value = item.id;
  dom.subscriptionName.value = item.name;
  dom.subscriptionProvider.value = item.provider;
  dom.subscriptionCategory.value = item.category;
  dom.subscriptionMonthly.value = item.monthlyCost;
  dom.subscriptionAnnual.value = item.annualCost;
  dom.subscriptionCurrency.value = item.currency;
  dom.subscriptionRenewal.value = item.renewalDate;
  dom.subscriptionStatus.value = item.status;
  dom.subscriptionFormTitle.textContent = "Editar suscripcion";
  renderView("suscripciones");
  openModal("subscriptionModal");
}

function fillTaskForm(item) {
  dom.taskId.value = item.id;
  dom.taskTitle.value = item.title;
  dom.taskDescription.value = item.description || "";
  dom.taskClient.value = item.clientId;
  syncControls();
  dom.taskProject.value = item.projectId || "";
  dom.taskResponsible.value = item.responsible || "";
  dom.taskPriority.value = item.priority || "media";
  dom.taskStatus.value = item.status || "pendiente";
  dom.taskDueDate.value = item.dueDate || "";
  dom.taskChecklist.value = (item.checklist || []).join("\n");
  dom.taskComments.value = item.comments || "";
  dom.taskFormTitle.textContent = "Editar tarea";
  renderView("tareas");
  openModal("taskModal");
}

function fillGoalForm(item) {
  dom.goalId.value = item.id;
  dom.goalName.value = item.name;
  dom.goalPeriod.value = item.period;
  dom.goalType.value = item.type;
  dom.goalTarget.value = item.target;
  dom.goalCurrent.value = item.current;
  dom.goalDueDate.value = item.dueDate;
  dom.goalFormTitle.textContent = "Editar meta";
  renderView("metas");
  openModal("goalModal");
}

function fillRequestForm(item) {
  dom.requestId.value = item.id;
  dom.requestClient.value = item.clientId;
  syncControls();
  dom.requestProject.value = item.projectId || "";
  dom.requestDescription.value = item.description;
  dom.requestType.value = item.type;
  dom.requestDate.value = item.date;
  dom.requestStatus.value = item.status;
  dom.requestPriority.value = item.priority;
  dom.requestResponsible.value = item.responsible || "";
  dom.requestDueDate.value = item.dueDate || "";
  dom.requestNotes.value = item.notes || "";
  dom.requestFormTitle.textContent = "Editar pedido";
  renderView("administracion");
  openModal("requestModal");
}

function fillNoteForm(item) {
  dom.noteId.value = item.id;
  dom.noteClient.value = item.clientId;
  syncControls();
  dom.noteProject.value = item.projectId || "";
  dom.noteTitle.value = item.title;
  dom.noteContent.value = item.content;
  dom.noteTone.value = item.tone || "normal";
  dom.noteFormTitle.textContent = "Editar nota";
  renderView("administracion");
  openModal("noteModal"); 
}

function fillActionForm(item) {
  dom.actionId.value = item.id;
  dom.actionClient.value = item.clientId;
  syncControls();
  dom.actionProject.value = item.projectId || "";
  dom.actionTitle.value = item.title;
  dom.actionDueDate.value = item.dueDate;
  dom.actionPriority.value = item.priority || "media";
  dom.actionStatus.value = item.status || "pendiente";
  dom.actionFormTitle.textContent = "Editar accion";
  renderView("administracion");
  openModal("actionModal");
}

function fillOpportunityForm(item) {
  dom.opportunityId.value = item.id;
  dom.opportunityClient.value = item.clientId;
  dom.opportunityTitle.value = item.title;
  dom.opportunityService.value = item.service || "";
  dom.opportunityValue.value = item.value || 0;
  dom.opportunityCurrency.value = item.currency || "ARS";
  dom.opportunityProbability.value = item.probability || 0;
  dom.opportunityStatus.value = item.status || "lead_nuevo";
  dom.opportunityNextAction.value = item.nextAction || "";
  dom.opportunityResponsible.value = item.responsible || "";
  dom.opportunityNotes.value = item.notes || "";
  dom.opportunityFormTitle.textContent = "Editar oportunidad";
  renderView("crm");
  openModal("opportunityModal");
}

function fillBudgetForm(item) {
  dom.budgetId.value = item.id;
  dom.budgetClient.value = item.clientId;
  if (dom.budgetNumber) dom.budgetNumber.value = item.number || "";
  dom.budgetProjectName.value = item.projectName;
  dom.budgetServices.value = item.services || "";
  dom.budgetDiscount.value = item.discount || 0;
  if (dom.budgetTaxes) dom.budgetTaxes.value = item.taxes || 0;
  dom.budgetCurrency.value = item.currency || "ARS";
  if (dom.budgetIssueDate) dom.budgetIssueDate.value = item.issueDate || toInputDate(parseDate(item.createdAt));
  dom.budgetValidUntil.value = item.validUntil || "";
  dom.budgetStatus.value = item.status || "borrador";
  dom.budgetNotes.value = item.notes || "";
  dom.budgetFormTitle.textContent = "Editar presupuesto";
  renderView("presupuestos");
  openModal("budgetModal");
}

function fillCalendarEventForm(item) {
  dom.calendarEventId.value = item.id;
  dom.calendarEventTitle.value = item.title;
  dom.calendarEventType.value = item.type || "reunion";
  dom.calendarEventDate.value = item.date || "";
  dom.calendarEventStart.value = item.startTime || "";
  dom.calendarEventEnd.value = item.endTime || "";
  dom.calendarEventClient.value = item.clientId || "";
  syncControls();
  dom.calendarEventProject.value = item.projectId || "";
  dom.calendarEventStatus.value = item.status || "pendiente";
  dom.calendarEventPriority.value = item.priority || "media";
  dom.calendarEventDescription.value = item.description || "";
  dom.calendarEventFormTitle.textContent = "Editar evento";
  renderView("calendario");
  openModal("calendarEventModal");
}

function fillDocumentForm(item) {
  dom.documentId.value = item.id;
  dom.documentName.value = item.name;
  dom.documentType.value = item.type || "";
  dom.documentClient.value = item.clientId || "";
  syncControls();
  dom.documentProject.value = item.projectId || "";
  dom.documentLink.value = item.link || "";
  dom.documentTags.value = item.tags || "";
  dom.documentDescription.value = item.description || "";
  dom.documentFormTitle.textContent = "Editar documento";
  renderView("documentos");
  openModal("documentModal");
}

function fillSupportForm(item) {
  dom.supportId.value = item.id;
  dom.supportClient.value = item.clientId;
  syncControls();
  dom.supportProject.value = item.projectId || "";
  dom.supportUrl.value = item.url || "";
  dom.supportDomain.value = item.domain || "";
  dom.supportHosting.value = item.hosting || "";
  dom.supportDomainRenewal.value = item.domainRenewal || "";
  dom.supportHostingRenewal.value = item.hostingRenewal || "";
  dom.supportPlan.value = item.plan || "";
  dom.supportMonthlyPrice.value = item.monthlyPrice || 0;
  dom.supportCurrency.value = item.currency || "ARS";
  dom.supportStatus.value = item.status || "activo";
  dom.supportNotes.value = item.notes || "";
  dom.supportFormTitle.textContent = "Editar mantenimiento";
  renderView("soporte");
  openModal("supportModal");
}

function fillTeamForm(item) {
  dom.teamId.value = item.id;
  dom.teamName.value = item.name;
  dom.teamEmail.value = item.email;
  dom.teamRole.value = item.role;
  dom.teamStatus.value = item.status || "activo";
  dom.teamFocus.value = item.focus || "";
  dom.teamFormTitle.textContent = "Editar miembro";
  renderView("equipo");
  openModal("teamModal");
}

function fillMarketingForm(item) {
  dom.marketingId.value = item.id;
  dom.marketingName.value = item.name;
  dom.marketingTarget.value = item.target;
  dom.marketingMessage.value = item.message || "";
  dom.marketingContacts.value = item.contacts || 0;
  dom.marketingResponses.value = item.responses || 0;
  dom.marketingMeetings.value = item.meetings || 0;
  dom.marketingSales.value = item.sales || 0;
  dom.marketingStatus.value = item.status || "activa";
  dom.marketingDate.value = item.date || "";
  dom.marketingFormTitle.textContent = "Editar campana";
  renderView("marketing");
  openModal("marketingModal");
}

function debounce(callback, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}
