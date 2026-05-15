import { restoreSession } from "./js/auth.js";
import { loadState } from "./js/storage.js";
import { bindDom, renderAll, resetActionForm, resetClientForm, resetGoalForm, resetInvoiceForm, resetMovementForm, resetNoteForm, resetPaymentForm, resetProjectForm, resetRequestForm, resetSubscriptionForm, resetTaskForm } from "./js/render.js";
import { bindEvents } from "./js/events.js";

document.addEventListener("DOMContentLoaded", async () => {
  bindDom();
  loadState();
  renderAll();
  bindEvents();
  restoreSession().then(() => {
    renderAll();
    if (!document.getElementById("appShell").hidden) {
      resetForms();
    }
  });
});

function resetForms() {
  resetPaymentForm();
  resetClientForm();
  resetProjectForm();
  resetInvoiceForm();
  resetMovementForm();
  resetSubscriptionForm();
  resetTaskForm();
  resetGoalForm();
  resetRequestForm();
  resetNoteForm();
  resetActionForm();
  renderAll();
}
