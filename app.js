import { loadState } from "./js/storage.js";
import { bindDom, renderAll, resetInvoiceForm, resetMovementForm, resetPaymentForm, resetProjectForm, resetSubscriptionForm } from "./js/render.js";
import { bindEvents } from "./js/events.js";

document.addEventListener("DOMContentLoaded", () => {
  bindDom();
  loadState();
  bindEvents();
  renderAll();
  if (!document.getElementById("appShell").hidden) {
    resetPaymentForm();
    resetProjectForm();
    resetInvoiceForm();
    resetMovementForm();
    resetSubscriptionForm();
    renderAll();
  }
});
