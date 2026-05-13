import { apiRequest } from "./http.js";

export const projectService = {
  async list() {
    const projects = [];
    let page = 1;
    let totalPages = 1;
    do {
      const payload = await apiRequest(`/projects?page=${page}&pageSize=100`);
      projects.push(...(payload.projects || []).map(fromApiProject));
      totalPages = payload.meta?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);
    return projects;
  },

  async create(input) {
    const payload = await apiRequest("/projects", {
      method: "POST",
      body: toApiProject(input)
    });
    return fromApiProject(payload.project);
  },

  async update(id, input) {
    const payload = await apiRequest(`/projects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: toApiProject(input)
    });
    return fromApiProject(payload.project);
  },

  async remove(id) {
    await apiRequest(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
};

function toApiProject(project) {
  return {
    clientId: project.clientId,
    name: project.name,
    description: emptyToUndefined(project.description),
    budget: Number(project.budget || 0),
    paid: Number(project.paid || 0),
    expenses: Number(project.expenses || 0),
    currency: project.currency,
    status: toApiStatus(project.status),
    progress: Number(project.progress || 0),
    responsible: emptyToUndefined(project.responsible),
    technologies: emptyToUndefined(project.technologies),
    links: emptyToUndefined(project.links),
    startsAt: emptyToUndefined(project.startDate || project.startsAt),
    dueAt: emptyToUndefined(project.dueDate || project.dueAt),
    notes: emptyToUndefined(project.notes)
  };
}

export function fromApiProject(project) {
  return {
    ...project,
    status: fromApiStatus(project.status),
    startDate: toDateInput(project.startsAt),
    dueDate: toDateInput(project.dueAt),
    description: project.description || "",
    responsible: project.responsible || "",
    technologies: project.technologies || "",
    links: project.links || "",
    notes: project.notes || "",
    tasks: []
  };
}

function toApiStatus(status) {
  return ({
    esperando_cliente: "pausado",
    cancelado: "pausado"
  })[status] || status || "planificacion";
}

function fromApiStatus(status) {
  return ({
    pausado: "esperando_cliente"
  })[status] || status || "planificacion";
}

function emptyToUndefined(value) {
  const text = String(value || "").trim();
  return text ? text : undefined;
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}
