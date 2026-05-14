import { PrismaClient, type Currency, type MovementType } from "@prisma/client";
const prisma = new PrismaClient();

const allowedUsers = (process.env.ALLOWED_LOGIN_USERS ?? "FranPernil,MaxiTaxi")
  .split(",")
  .map((user) => user.trim())
  .filter(Boolean);

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.paymentInstallment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.projectTask.deleteMany();
  await prisma.project.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.dashboardWidget.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: allowedUsers[0] ?? "FranPernil",
      username: allowedUsers[0] ?? "FranPernil",
      email: `${(allowedUsers[0] ?? "FranPernil").toLowerCase()}@swallet.local`,
      role: "admin",
      status: "activo",
      permissions: ["clients", "finance", "projects", "reports", "settings", "write", "delete"]
    }
  });

  if (allowedUsers[1]) {
    await prisma.user.create({
      data: {
        name: allowedUsers[1],
        username: allowedUsers[1],
        email: `${allowedUsers[1].toLowerCase()}@swallet.local`,
        role: "admin",
        status: "activo",
        permissions: ["clients", "finance", "projects", "reports", "settings", "write", "delete"]
      }
    });
  }

  const categoryData: Array<{ name: string; color: string; icon: string }> = [
    { name: "hosting", color: "#9f5cff", icon: "Server" },
    { name: "dominios", color: "#5cc8ff", icon: "Globe" },
    { name: "publicidad", color: "#ff7a59", icon: "Megaphone" },
    { name: "herramientas", color: "#35d49a", icon: "Wrench" },
    { name: "salarios", color: "#f5c451", icon: "Users" },
    { name: "infraestructura", color: "#8b7cff", icon: "Cloud" },
    { name: "diseño", color: "#ff5c7a", icon: "Palette" },
    { name: "desarrollo", color: "#67e8f9", icon: "Code" },
    { name: "marketing", color: "#fb923c", icon: "TrendingUp" },
    { name: "otros", color: "#a9a7ba", icon: "Circle" }
  ];

  const categories = await Promise.all(
    categoryData.map((category) => prisma.category.create({ data: category }))
  );

  const findCategory = (name: string) => categories.find((category) => category.name === name)!;

  await prisma.exchangeRate.createMany({
    data: [
      { rate: "1160.00", validAt: addDays(-20), source: "manual" },
      { rate: "1185.00", validAt: addDays(-10), source: "manual" },
      { rate: "1200.00", validAt: new Date(), source: "manual" }
    ]
  });

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Lucia Fernandez",
        company: "Norte Lab",
        email: "lucia@nortelab.com",
        phone: "+54 9 11 4422 8011",
        service: "Sitio web institucional",
        agreedPrice: "980000",
        currency: "ARS",
        status: "activo",
        startDate: addDays(-45),
        observations: "Cliente estratégico con potencial de mantenimiento mensual."
      }
    }),
    prisma.client.create({
      data: {
        name: "Martin Rivas",
        company: "Rivas Legal",
        email: "martin@rivaslegal.com",
        phone: "+598 94 222 108",
        service: "Mantenimiento mensual",
        agreedPrice: "850",
        currency: "USD",
        status: "mantenimiento",
        startDate: addDays(-90),
        observations: "Cuenta recurrente con soporte y mejoras evolutivas."
      }
    }),
    prisma.client.create({
      data: {
        name: "Camila Soto",
        company: "Mercado Aura",
        email: "camila@mercadoaura.com",
        phone: "+54 9 351 551 9921",
        service: "Ecommerce y performance",
        agreedPrice: "1500",
        currency: "USD",
        status: "en_desarrollo",
        startDate: addDays(-18),
        observations: "Proyecto con pagos por hitos y campañas de performance."
      }
    }),
    prisma.client.create({
      data: {
        name: "Diego Morales",
        company: "Studio Delta",
        email: "diego@studiodelta.com",
        phone: "+54 9 221 392 4830",
        service: "Identidad visual",
        agreedPrice: "640000",
        currency: "ARS",
        status: "finalizado",
        startDate: addDays(-120),
        observations: "Proyecto cerrado con oportunidad de webflow."
      }
    })
  ]);

  await prisma.payment.createMany({
    data: [
      payment(clients[0].id, 980000, "ARS", -8, -3, "pagado", 980000, "transferencia"),
      payment(clients[1].id, 850, "USD", -4, 3, "pendiente", 0, "wise"),
      payment(clients[2].id, 1500, "USD", -18, -2, "vencido", 500, "transferencia"),
      payment(clients[3].id, 640000, "ARS", -34, -25, "pagado", 640000, "transferencia"),
      payment(clients[0].id, 420000, "ARS", 1, 7, "pendiente", 0, "mercadopago")
    ]
  });

  await prisma.movement.createMany({
    data: [
      movement("ingreso", findCategory("desarrollo").id, "Consultoría estratégica", 380, "USD", -12, "Sesión estratégica para cliente puntual."),
      movement("gasto", findCategory("herramientas").id, "Suite de diseño", 95, "USD", -10, "Herramientas de diseño y automatización."),
      movement("gasto", findCategory("otros").id, "Impuestos mensuales", 210000, "ARS", -7, "Pago mensual de obligaciones."),
      movement("ingreso", findCategory("desarrollo").id, "Bolsa de horas", 260000, "ARS", -5, "Bolsa de horas técnica."),
      movement("inversion", findCategory("marketing").id, "Campaña de adquisición", 120000, "ARS", -2, "Campaña para captar cuentas SaaS.")
    ]
  });

  await prisma.project.create({
    data: {
      clientId: clients[2].id,
      name: "Mercado Aura Ecommerce",
      description: "Tienda online con catálogo, pagos, analítica y performance.",
      status: "en_progreso",
      progress: 68,
      budget: "1500",
      currency: "USD",
      startsAt: addDays(-18),
      dueAt: addDays(18),
      tasks: {
        create: [
          { title: "Arquitectura y wireframes", completed: true, position: 1 },
          { title: "Checkout y catálogo", completed: true, position: 2 },
          { title: "Integración analytics", completed: false, position: 3 },
          { title: "QA mobile", completed: false, position: 4 }
        ]
      }
    }
  });

  await prisma.project.create({
    data: {
      clientId: clients[0].id,
      name: "Norte Lab Web",
      description: "Sitio institucional premium con CMS y SEO técnico.",
      status: "revision",
      progress: 92,
      budget: "980000",
      currency: "ARS",
      startsAt: addDays(-45),
      dueAt: addDays(4)
    }
  });

  await prisma.subscription.createMany({
    data: [
      subscription("Vercel Pro", "Vercel", "plataformas", 20, 240, "USD", 12, "activa"),
      subscription("Dominios clientes", "Namecheap", "dominios", 42, 504, "USD", 21, "por_vencer"),
      subscription("OpenAI API", "OpenAI", "APIs", 130, 1560, "USD", 30, "activa"),
      subscription("Workspace", "Google", "herramientas", 98000, 1176000, "ARS", 8, "por_vencer")
    ]
  });

  await prisma.clientNote.create({
    data: {
      clientId: clients[2].id,
      userId: admin.id,
      body: "Priorizar checkout mobile y performance para campaña de lanzamiento."
    }
  });

  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, clientId: clients[0].id, type: "pago_registrado", title: "Pago registrado", body: "Norte Lab abonó el sitio institucional." },
      { userId: admin.id, clientId: clients[2].id, type: "estado", title: "Pago vencido", body: "Primer hito de ecommerce requiere seguimiento." },
      { userId: admin.id, clientId: clients[2].id, type: "nota", title: "Nota interna", body: "Reunión de avance agendada." }
    ]
  });

  await prisma.dashboardWidget.createMany({
    data: [
      { userId: admin.id, key: "bank-card", title: "Saldo operativo", position: 1 },
      { userId: admin.id, key: "cashflow", title: "Cashflow", position: 2 },
      { userId: admin.id, key: "debts", title: "Deudas", position: 3 }
    ]
  });
}

function payment(
  clientId: string,
  amount: number,
  currency: Currency,
  dateOffset: number,
  dueOffset: number,
  status: "pendiente" | "pagado" | "vencido" | "cancelado",
  paidAmount: number,
  method: "transferencia" | "mercadopago" | "wise"
) {
  return {
    clientId,
    amount,
    paidAmount,
    currency,
    date: addDays(dateOffset),
    dueDate: addDays(dueOffset),
    status,
    method,
    notes: "Dato demo generado para validar panel financiero."
  };
}

function movement(
  type: MovementType,
  categoryId: string,
  description: string,
  amount: number,
  currency: Currency,
  dateOffset: number,
  body: string
) {
  return {
    type,
    categoryId,
    description: `${description}: ${body}`,
    amount,
    currency,
    date: addDays(dateOffset)
  };
}

function subscription(
  name: string,
  provider: string,
  category: string,
  monthlyCost: number,
  annualCost: number,
  currency: Currency,
  renewOffset: number,
  status: "activa" | "por_vencer" | "vencida" | "cancelada"
) {
  return {
    name,
    provider,
    category,
    monthlyCost,
    annualCost,
    currency,
    renewsAt: addDays(renewOffset),
    status
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
