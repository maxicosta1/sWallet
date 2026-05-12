import { canDelete, canWrite, login, logout, registerInitialUser } from "./auth.js";
import { filteredInvoices, projectExists, clientExists } from "./finance.js";
import { createRecord, state } from "./state.js";
import { saveState, resetStorage } from "./storage.js";
import {
  closeMobileMenu,
  dom,
  getInvoice,
  notify,
  renderAll,
  renderView,
  resetActionForm,
  resetClientForm,
  resetGoalForm,
  resetInvoiceForm,
  resetMovementForm,
  resetNoteForm,
  resetPaymentForm,
  resetProjectForm,
  resetRequestForm,
  resetSubscriptionForm,
  resetTaskForm,
  syncControls
} from "./render.js";

export function bindEvents() {
  dom.registerForm.addEventListener("submit", handleRegister);
  dom.loginForm.addEventListener("submit", handleLogin);
  dom.logoutButton.addEventListener("click", () => {
    logout();
    renderAll();
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => renderView(link.dataset.view));
  });
  document.querySelectorAll(".action-bubble").forEach((button) => {
    button.addEventListener("click", () => renderView(button.dataset.view));
  });

  document.querySelector("[data-quick-action='payment']").addEventListener("click", () => renderView("pagos"));
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

  dom.cancelClientEdit.addEventListener("click", resetClientForm);
  dom.cancelPaymentEdit.addEventListener("click", resetPaymentForm);
  dom.cancelProjectEdit.addEventListener("click", resetProjectForm);
  dom.cancelInvoiceEdit.addEventListener("click", resetInvoiceForm);
  dom.cancelMovementEdit.addEventListener("click", resetMovementForm);
  dom.cancelSubscriptionEdit.addEventListener("click", resetSubscriptionForm);
  dom.cancelTaskEdit.addEventListener("click", resetTaskForm);
  dom.cancelGoalEdit.addEventListener("click", resetGoalForm);
  dom.cancelRequestEdit.addEventListener("click", resetRequestForm);
  dom.goCreateClient.addEventListener("click", () => renderView("clientes"));

  dom.invoiceClient.addEventListener("change", syncControls);
  [dom.taskClient, dom.requestClient, dom.noteClient, dom.actionClient].forEach((control) => control.addEventListener("change", syncControls));
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
  dom.printReport.addEventListener("click", () => window.print());

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

function handleRegister(event) {
  event.preventDefault();
  try {
    registerInitialUser({
      name: dom.registerName.value.trim(),
      email: dom.registerEmail.value.trim(),
      password: dom.registerPassword.value
    });
    notify("Usuario creado", "Sesion iniciada como admin.");
    renderAll();
  } catch (error) {
    dom.registerError.textContent = error.message;
    dom.registerError.hidden = false;
  }
}

function handleLogin(event) {
  event.preventDefault();
  try {
    login({
      email: dom.loginEmail.value.trim(),
      password: dom.loginPassword.value
    });
    dom.loginError.hidden = true;
    notify("Bienvenido", "Sesion iniciada correctamente.");
    renderAll();
  } catch (error) {
    dom.loginError.textContent = error.message;
    dom.loginError.hidden = false;
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

function handleClientSubmit(event) {
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
  if (dom.clientId.value) updateRecord(state.clients, dom.clientId.value, payload);
  else state.clients.push(createRecord(payload));
  saveAndRender("Cliente guardado", "Los datos quedaron disponibles.");
  resetClientForm();
}

function handleProjectSubmit(event) {
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
  if (dom.projectId.value) updateRecord(state.projects, dom.projectId.value, payload);
  else state.projects.push(createRecord(payload));
  resetProjectForm();
  saveAndRender("Proyecto guardado", "Quedo asociado al cliente.");
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

function saveAndRender(title, message) {
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
    ...state.goals.filter((item) => item.userId === userId).map((item) => ["meta", item.name, "", "", item.current, item.type, item.status, item.dueDate])
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
  window.deleteClient = (id) => deleteGeneric("clients", id, "Cliente eliminado");
  window.editProject = (id) => editGeneric("projects", id, fillProjectForm);
  window.deleteProject = (id) => deleteGeneric("projects", id, "Proyecto eliminado");
  window.editInvoice = (id) => editGeneric("invoices", id, fillInvoiceForm);
  window.deleteInvoice = (id) => deleteGeneric("invoices", id, "Factura eliminada");
  window.editPayment = (id) => editGeneric("payments", id, fillPaymentForm);
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
  window.goSearchResult = (view) => {
    state.globalSearch = "";
    renderView(view);
    renderAll();
  };
};

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
}

function debounce(callback, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}
