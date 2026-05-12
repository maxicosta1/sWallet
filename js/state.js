export const STORAGE_KEY = "scodeFinanceApp";
export const DAY_MS = 24 * 60 * 60 * 1000;

export const state = {
  users: [],
  session: null,
  clients: [],
  projects: [],
  invoices: [],
  payments: [],
  movements: [],
  subscriptions: [],
  tasks: [],
  goals: [],
  requests: [],
  notes: [],
  actions: [],
  opportunities: [],
  budgets: [],
  calendarEvents: [],
  documents: [],
  supportPlans: [],
  teamMembers: [],
  marketingCampaigns: [],
  clientPortalItems: [],
  exchangeRate: 1200,
  activeView: "dashboard",
  globalSearch: "",
  selectedBillingClientId: "",
  filters: {
    from: "",
    to: "",
    clientId: "",
    currency: "",
    status: ""
  },
  billingFilters: {
    clientId: "",
    projectId: "",
    status: "",
    currency: "",
    from: "",
    to: "",
    quick: ""
  },
  projectFilterClientId: "",
  selectedClientId: "",
  taskFilter: "",
  goalFilter: "",
  adminFilterClientId: "",
  selectedPortalClientId: ""
};

export function createRecord(payload) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    ...payload
  };
}

export function generateId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(value) {
  if (value instanceof Date) return value;
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return new Date(value);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function seedDemoData(userId) {
  const today = new Date();
  const d = (offset) => toInputDate(new Date(today.getTime() + offset * DAY_MS));

  const clients = [
    createRecord({ userId, name: "Lucia Fernandez", company: "Norte Lab", email: "lucia@nortelab.com", phone: "+54 9 11 4422 8011", address: "Buenos Aires, AR", socials: "@nortelab", website: "https://nortelab.com", service: "Sitio web institucional", amount: 980000, currency: "ARS", status: "cliente_activo", priority: "alta", firstContact: d(-80), lastContact: d(-2), startDate: d(-45), observations: "Cliente estrategico con potencial de mantenimiento." }),
    createRecord({ userId, name: "Martin Rivas", company: "Rivas Legal", email: "martin@rivaslegal.com", phone: "+598 94 222 108", address: "Montevideo, UY", socials: "LinkedIn Rivas Legal", website: "https://rivaslegal.com", service: "Mantenimiento mensual", amount: 850, currency: "USD", status: "cliente_activo", priority: "media", firstContact: d(-130), lastContact: d(-11), startDate: d(-90), observations: "Cuenta recurrente de soporte." }),
    createRecord({ userId, name: "Camila Soto", company: "Mercado Aura", email: "camila@mercadoaura.com", phone: "+54 9 351 551 9921", address: "Cordoba, AR", socials: "@mercadoaura", website: "https://mercadoaura.com", service: "Ecommerce y performance", amount: 1500, currency: "USD", status: "en_negociacion", priority: "urgente", firstContact: d(-35), lastContact: d(-6), startDate: d(-18), observations: "Proyecto por hitos. Riesgo por pago vencido." }),
    createRecord({ userId, name: "Diego Morales", company: "Studio Delta", email: "diego@studiodelta.com", phone: "+54 9 221 392 4830", address: "La Plata, AR", socials: "@studiodelta", website: "https://studiodelta.com", service: "Identidad visual", amount: 640000, currency: "ARS", status: "proyecto_finalizado", priority: "baja", firstContact: d(-160), lastContact: d(-28), startDate: d(-120), observations: "Proyecto cerrado." })
  ];

  const projects = [
    createRecord({ userId, clientId: clients[2].id, name: "Mercado Aura Ecommerce", description: "Tienda online con catalogo, pagos y analitica.", budget: 1500, paid: 500, expenses: 95, currency: "USD", status: "en_desarrollo", progress: 68, responsible: "Bruno", technologies: "Next.js, Shopify, Analytics", links: "Drive / Figma", startDate: d(-18), dueDate: d(18), notes: "Priorizar checkout mobile.", tasks: ["Arquitectura y wireframes", "Checkout y catalogo", "Analytics", "QA mobile"] }),
    createRecord({ userId, clientId: clients[0].id, name: "Norte Lab Web", description: "Sitio institucional premium con SEO tecnico.", budget: 980000, paid: 980000, expenses: 120000, currency: "ARS", status: "en_revision", progress: 92, responsible: "Agustin", technologies: "Astro, CMS, SEO", links: "Figma / Deploy preview", startDate: d(-45), dueDate: d(4), notes: "Lista para revision final.", tasks: ["Diseno UI", "CMS", "Performance", "Publicacion"] }),
    createRecord({ userId, clientId: clients[1].id, name: "Rivas Legal Care", description: "Mantenimiento mensual y mejoras evolutivas.", budget: 850, paid: 0, expenses: 60, currency: "USD", status: "en_desarrollo", progress: 45, responsible: "Tomas", technologies: "WordPress, Cloudflare", links: "Backlog Notion", startDate: d(-60), dueDate: d(25), notes: "Backlog mensual.", tasks: ["Backlog mensual", "Seguridad", "Reportes"] })
  ];

  const invoices = [
    createRecord({ userId, clientId: clients[0].id, projectId: projects[1].id, number: "F-0001", amount: 980000, currency: "ARS", issueDate: d(-10), dueDate: d(-3), status: "pagada", notes: "Sitio institucional." }),
    createRecord({ userId, clientId: clients[1].id, projectId: projects[2].id, number: "F-0002", amount: 850, currency: "USD", issueDate: d(-4), dueDate: d(3), status: "pendiente", notes: "Fee mensual de soporte." }),
    createRecord({ userId, clientId: clients[2].id, projectId: projects[0].id, number: "F-0003", amount: 1500, currency: "USD", issueDate: d(-18), dueDate: d(-2), status: "vencida", notes: "Primer hito ecommerce." }),
    createRecord({ userId, clientId: clients[3].id, projectId: "", number: "F-0004", amount: 640000, currency: "ARS", issueDate: d(-34), dueDate: d(-25), status: "pagada", notes: "Branding cerrado." }),
    createRecord({ userId, clientId: clients[0].id, projectId: projects[1].id, number: "F-0005", amount: 420000, currency: "ARS", issueDate: d(1), dueDate: d(7), status: "pendiente", notes: "Upsell SEO." })
  ];

  const payments = [
    createRecord({ userId, clientId: clients[0].id, projectId: projects[1].id, invoiceId: invoices[0].id, amount: 980000, currency: "ARS", date: d(-8), dueDate: d(-3), status: "pagado", method: "Transferencia", notes: "Pago completo." }),
    createRecord({ userId, clientId: clients[2].id, projectId: projects[0].id, invoiceId: invoices[2].id, amount: 500, currency: "USD", date: d(-15), dueDate: d(-2), status: "pagado", method: "Transferencia", notes: "Pago parcial." }),
    createRecord({ userId, clientId: clients[3].id, projectId: "", invoiceId: invoices[3].id, amount: 640000, currency: "ARS", date: d(-34), dueDate: d(-25), status: "pagado", method: "Transferencia", notes: "Cierre de branding." })
  ];

  const movements = [
    createRecord({ userId, type: "ingreso", category: "Consultoria", amount: 380, currency: "USD", date: d(-12), description: "Sesion estrategica para cliente puntual." }),
    createRecord({ userId, type: "salida", category: "Software", amount: 95, currency: "USD", date: d(-10), description: "Herramientas de diseno y automatizacion." }),
    createRecord({ userId, type: "salida", category: "Impuestos", amount: 210000, currency: "ARS", date: d(-7), description: "Pago mensual de obligaciones." }),
    createRecord({ userId, type: "ingreso", category: "Soporte", amount: 260000, currency: "ARS", date: d(-5), description: "Bolsa de horas tecnica." }),
    createRecord({ userId, type: "salida", category: "Marketing", amount: 120000, currency: "ARS", date: d(-2), description: "Campana de adquisicion." })
  ];

  const subscriptions = [
    createRecord({ userId, name: "Vercel Pro", provider: "Vercel", category: "Hosting", monthlyCost: 20, annualCost: 240, currency: "USD", renewalDate: d(12), status: "activa" }),
    createRecord({ userId, name: "Dominios clientes", provider: "Namecheap", category: "Dominios", monthlyCost: 42, annualCost: 504, currency: "USD", renewalDate: d(21), status: "por_vencer" }),
    createRecord({ userId, name: "OpenAI API", provider: "OpenAI", category: "APIs", monthlyCost: 130, annualCost: 1560, currency: "USD", renewalDate: d(30), status: "activa" }),
    createRecord({ userId, name: "Workspace", provider: "Google", category: "Herramientas", monthlyCost: 98000, annualCost: 1176000, currency: "ARS", renewalDate: d(8), status: "por_vencer" })
  ];

  const tasks = [
    createRecord({ userId, clientId: clients[2].id, projectId: projects[0].id, title: "Resolver checkout mobile", description: "Ajustar experiencia de compra y validaciones.", responsible: "Bruno", priority: "urgente", status: "en_proceso", dueDate: d(2), checklist: ["QA iPhone", "QA Android", "Deploy"], comments: "Bloquea entrega del hito." }),
    createRecord({ userId, clientId: clients[0].id, projectId: projects[1].id, title: "Enviar revision final", description: "Compartir preview y checklist de aprobacion.", responsible: "Agustin", priority: "alta", status: "en_revision", dueDate: d(1), checklist: ["Performance", "SEO", "Email cliente"], comments: "" }),
    createRecord({ userId, clientId: clients[1].id, projectId: projects[2].id, title: "Reporte mensual de soporte", description: "Preparar resumen de cambios y seguridad.", responsible: "Tomas", priority: "media", status: "pendiente", dueDate: d(7), checklist: ["Cambios", "Backups", "Pendientes"], comments: "" })
  ];

  const goals = [
    createRecord({ userId, name: "Ingresos mayo", period: "mensual", type: "ingresos", target: 4500000, current: 3180000, dueDate: d(20), status: "en_progreso" }),
    createRecord({ userId, name: "Cerrar 3 proyectos", period: "mensual", type: "proyectos_finalizados", target: 3, current: 1, dueDate: d(25), status: "en_progreso" }),
    createRecord({ userId, name: "Reducir gastos operativos", period: "trimestral", type: "reduccion_gastos", target: 20, current: 8, dueDate: d(70), status: "en_progreso" })
  ];

  const requests = [
    createRecord({ userId, clientId: clients[2].id, projectId: projects[0].id, description: "Agregar cupones y compra rapida.", type: "nueva_funcionalidad", date: d(-3), status: "en_proceso", priority: "alta", responsible: "Bruno", dueDate: d(8), notes: "Validar alcance antes de sumar al presupuesto." }),
    createRecord({ userId, clientId: clients[0].id, projectId: projects[1].id, description: "Revisar textos de servicios.", type: "revision", date: d(-1), status: "pendiente", priority: "media", responsible: "Agustin", dueDate: d(4), notes: "Esperando contenido definitivo." })
  ];

  const notes = [
    createRecord({ userId, clientId: clients[2].id, projectId: projects[0].id, title: "Riesgo de alcance", content: "El cliente pidio cambios extra fuera del hito inicial.", date: d(-4), tone: "riesgo" }),
    createRecord({ userId, clientId: clients[1].id, projectId: projects[2].id, title: "Upsell posible", content: "Interes en landing para campana Q3.", date: d(-9), tone: "oportunidad" })
  ];

  const actions = [
    createRecord({ userId, clientId: clients[2].id, projectId: projects[0].id, title: "Cobrar saldo pendiente", dueDate: d(1), priority: "urgente", status: "pendiente" }),
    createRecord({ userId, clientId: clients[0].id, projectId: projects[1].id, title: "Coordinar reunion de cierre", dueDate: d(3), priority: "alta", status: "pendiente" })
  ];

  const opportunities = [
    createRecord({ userId, clientId: clients[2].id, title: "Performance ecommerce Q3", service: "Ecommerce + performance", value: 2200, currency: "USD", probability: 72, status: "negociacion", nextAction: "Enviar alcance revisado", responsible: "Comercial", notes: "Buen potencial de upsell mensual." }),
    createRecord({ userId, clientId: clients[1].id, title: "Landing campana legal", service: "Landing page premium", value: 950, currency: "USD", probability: 58, status: "reunion_agendada", nextAction: "Preparar propuesta", responsible: "Agustin", notes: "Necesita conversion a leads." })
  ];

  const budgets = [
    createRecord({ userId, clientId: clients[2].id, projectName: "Growth ecommerce", services: "Auditoria UX:500\nOptimizacion checkout:900\nCampanas:600", discount: 0, currency: "USD", validUntil: d(12), status: "enviado", notes: "Valido por 12 dias." }),
    createRecord({ userId, clientId: clients[0].id, projectName: "SEO tecnico Norte Lab", services: "Auditoria SEO:180000\nImplementacion tecnica:240000", discount: 20000, currency: "ARS", validUntil: d(8), status: "borrador", notes: "Puede convertirse en retainer." })
  ];

  const calendarEvents = [
    createRecord({ userId, title: "Revision Norte Lab", type: "reunion", date: d(1), startTime: "10:00", endTime: "10:45", clientId: clients[0].id, projectId: projects[1].id, status: "pendiente", priority: "alta", description: "Validar entrega final." }),
    createRecord({ userId, title: "Seguimiento Mercado Aura", type: "seguimiento", date: d(3), startTime: "15:00", endTime: "15:30", clientId: clients[2].id, projectId: projects[0].id, status: "pendiente", priority: "urgente", description: "Cobro y alcance del siguiente hito." })
  ];

  const documents = [
    createRecord({ userId, name: "Brief Mercado Aura", type: "brief", clientId: clients[2].id, projectId: projects[0].id, link: "https://drive.google.com", tags: "brief,ecommerce", description: "Brief inicial y referencias de marca." }),
    createRecord({ userId, name: "Contrato Norte Lab", type: "contrato", clientId: clients[0].id, projectId: projects[1].id, link: "https://drive.google.com", tags: "contrato,legal", description: "Contrato de desarrollo institucional." })
  ];

  const supportPlans = [
    createRecord({ userId, clientId: clients[1].id, projectId: projects[2].id, url: "https://rivaslegal.com", domain: "rivaslegal.com", hosting: "Cloudflare + WP", domainRenewal: d(45), hostingRenewal: d(18), plan: "Mantenimiento mensual", monthlyPrice: 850, currency: "USD", status: "activo", notes: "Incluye seguridad, backups y mejoras menores." })
  ];

  const teamMembers = [
    createRecord({ userId, name: "Agustin", email: "agustin@scode.com", role: "Administrador", status: "activo", focus: "Direccion, clientes y UX" }),
    createRecord({ userId, name: "Bruno", email: "bruno@scode.com", role: "Desarrollador", status: "activo", focus: "Frontend y ecommerce" })
  ];

  const marketingCampaigns = [
    createRecord({ userId, name: "Estudios contables mayo", target: "Estudios contables", message: "Web profesional para captar consultas", contacts: 80, responses: 12, meetings: 4, sales: 1, status: "activa", date: d(-6) })
  ];

  const clientPortalItems = [
    createRecord({ userId, clientId: clients[2].id, title: "Preview ecommerce", type: "avance", status: "visible", link: "https://preview.scode.dev", notes: "Demo interna simulada para futuro portal." })
  ];

  return { clients, projects, invoices, payments, movements, subscriptions, tasks, goals, requests, notes, actions, opportunities, budgets, calendarEvents, documents, supportPlans, teamMembers, marketingCampaigns, clientPortalItems };
}
