import { apiRequest } from "./http.js";

export const clientService = {
  async list() {
    const clients = [];
    let page = 1;
    let totalPages = 1;
    do {
      const payload = await apiRequest(`/clients?page=${page}&pageSize=100`);
      clients.push(...(payload.clients || []).map(fromApiClient));
      totalPages = payload.meta?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);
    return clients;
  },

  async create(input) {
    const payload = await apiRequest("/clients", {
      method: "POST",
      body: toApiClient(input)
    });
    return fromApiClient(payload.client);
  },

  async update(id, input) {
    const payload = await apiRequest(`/clients/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: toApiClient(input)
    });
    return fromApiClient(payload.client);
  },

  async remove(id) {
    await apiRequest(`/clients/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
};

function toApiClient(client) {
  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: emptyToUndefined(client.address),
    socials: emptyToUndefined(client.socials),
    website: emptyToUndefined(client.website),
    service: client.service,
    agreedPrice: Number(client.amount || client.agreedPrice || 0),
    currency: client.currency,
    status: toApiStatus(client.status),
    priority: client.priority,
    firstContact: emptyToUndefined(client.firstContact),
    lastContact: emptyToUndefined(client.lastContact),
    startDate: emptyToUndefined(client.startDate),
    observations: emptyToUndefined(client.observations)
  };
}

export function fromApiClient(client) {
  return {
    ...client,
    amount: Number(client.agreedPrice || 0),
    status: fromApiStatus(client.status),
    firstContact: toDateInput(client.firstContact),
    lastContact: toDateInput(client.lastContact),
    startDate: toDateInput(client.startDate),
    address: client.address || "",
    socials: client.socials || "",
    website: client.website || "",
    observations: client.observations || ""
  };
}

function toApiStatus(status) {
  return ({
    contactado: "interesado",
    presupuesto_enviado: "en_negociacion",
    esperando_respuesta: "en_negociacion",
    perdido: "finalizado"
  })[status] || status || "lead";
}

function fromApiStatus(status) {
  return ({
    interesado: "contactado",
    activo: "cliente_activo",
    en_desarrollo: "cliente_activo",
    mantenimiento: "cliente_activo",
    finalizado: "proyecto_finalizado"
  })[status] || status || "lead";
}

function emptyToUndefined(value) {
  const text = String(value || "").trim();
  return text ? text : undefined;
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}
