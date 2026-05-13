# Contrato LocalStorage Actual

Este documento congela el contrato actual de datos para migrar luego a PostgreSQL sin romper backups ni UI.

## Fuente

- Clave: `scodeFinanceApp`
- Version actual: `schemaVersion = 4`
- Codigo: `js/state.js`, `js/storage.js`, `js/auth.js`, `js/events.js`
- Persistencia: snapshot JSON completo en `localStorage`
- Sesion: objeto `session` dentro del mismo snapshot

## Snapshot Raiz

```ts
type LocalSnapshot = {
  schemaVersion: number;
  savedAt: string;
  session: { userId: string; createdAt: string } | null;
  companySettings: CompanySettings;
  exchangeRate: number;
  users: LocalUser[];
  clients: LocalClient[];
  projects: LocalProject[];
  invoices: LocalInvoice[];
  payments: LocalPayment[];
  movements: LocalMovement[];
  subscriptions: LocalSubscription[];
  tasks: LocalTask[];
  goals: LocalGoal[];
  requests: LocalRequest[];
  notes: LocalNote[];
  actions: LocalAction[];
  opportunities: LocalOpportunity[];
  budgets: LocalBudget[];
  calendarEvents: LocalCalendarEvent[];
  documents: LocalDocument[];
  supportPlans: LocalSupportPlan[];
  teamMembers: LocalTeamMember[];
  marketingCampaigns: LocalMarketingCampaign[];
  clientPortalItems: LocalClientPortalItem[];
  activityLogs: LocalActivityLog[];
};
```

Todos los registros operativos usan `id`, `createdAt`, `updatedAt` y normalmente `userId`.

## Entidades Detectadas

### Usuarios

Campos: `id`, `name`, `username`, `email`, `passwordHashMock`, `role`, `status`, `permissions`, `avatar`, `phone`, `area`, `notes`, timestamps.

Roles actuales: `admin`, `finanzas`, `solo_lectura`. Prisma tambien contempla `desarrollador`.

Migracion: `passwordHashMock` no se migra como password real. Forzar reset o crear hash bcrypt desde flujo controlado.

### Clientes

Campos: `name`, `company`, `email`, `phone`, `address`, `socials`, `website`, `service`, `amount`, `currency`, `status`, `priority`, `firstContact`, `lastContact`, `startDate`, `observations`.

Relaciones por id: proyectos, facturas, pagos, tareas, CRM, documentos, soporte, portal, logs.

### Proyectos

Campos: `clientId`, `name`, `description`, `budget`, `paid`, `expenses`, `currency`, `status`, `progress`, `responsible`, `technologies`, `links`, `startDate`, `dueDate`, `notes`, `tasks`.

`tasks` interno es lista simple de strings/checklist en algunos datos demo. En PostgreSQL conviene normalizar a `project_tasks`.

### Facturas

Campos: `clientId`, `projectId`, `number`, `amount`, `currency`, `issueDate`, `dueDate`, `status`, `notes`.

Estados detectados: `pendiente`, `pagada`, `vencida`, `cancelada`.

### Pagos

Campos: `clientId`, `projectId`, `invoiceId`, `amount`, `currency`, `date`, `dueDate`, `status`, `method`, `notes`.

Tambien existe en Prisma parcial `paidAmount`, `isRecurring`, `recurringRule`, `installments`.

### Movimientos

Campos: `type`, `category`, `amount`, `currency`, `date`, `description`.

Tipos detectados: `ingreso`, `salida`; Prisma futuro acepta tambien `gasto`, `inversion` para normalizacion.

### Suscripciones

Campos: `name`, `provider`, `category`, `monthlyCost`, `annualCost`, `currency`, `renewalDate`, `status`.

Prisma parcial usa `renewsAt`; migrador debe mapear `renewalDate -> renewsAt`.

### Tareas Operativas

Campos: `clientId`, `projectId`, `title`, `description`, `responsible`, `priority`, `status`, `dueDate`, `checklist`, `comments`.

### Metas

Campos: `name`, `period`, `type`, `target`, `current`, `dueDate`, `status`, `priority`.

### CRM / Oportunidades

Campos: `clientId`, `title`, `service`, `value`, `currency`, `probability`, `status`, `nextAction`, `responsible`, `notes`.

### Presupuestos

Campos: `clientId`, `projectName`, `services`, `discount`, `currency`, `validUntil`, `status`, `notes`.

`services` es texto multilnea con items. En PostgreSQL conviene `budget_items`.

### Calendario

Campos: `title`, `type`, `date`, `startTime`, `endTime`, `clientId`, `projectId`, `status`, `priority`, `description`.

### Documentos

Campos: `name`, `type`, `clientId`, `projectId`, `link`, `tags`, `description`.

### Soporte / Mantenimiento

Campos: `clientId`, `projectId`, `url`, `domain`, `hosting`, `domainRenewal`, `hostingRenewal`, `plan`, `monthlyPrice`, `currency`, `status`, `notes`.

### Equipo

Campos: `name`, `email`, `role`, `status`, `focus`.

### Marketing

Campos: `name`, `target`, `message`, `contacts`, `responses`, `meetings`, `sales`, `status`, `date`.

### Portal Cliente

Campos: `clientId`, `title`, `type`, `status`, `link`, `notes`.

### Auditoria

Campos: `userId`, `clientId`, `type`, `title`, `body`, `metadata`, `createdAt`.

## Reglas De Migracion

1. Leer snapshot con `migrateSnapshot()` antes de transformar.
2. Insertar usuarios primero.
3. Insertar clientes.
4. Insertar proyectos, facturas, pagos, movimientos.
5. Insertar tareas, metas, CRM, presupuestos, calendario, documentos, soporte, marketing, portal.
6. Insertar logs al final.
7. Mantener ids originales como ids PostgreSQL si son UUID/CUID validos; si no, guardar `legacyId`.
8. Convertir montos a `Decimal(14,2)`.
9. Convertir fechas string a `DateTime`; si fecha invalida, rechazar fila y reportar.
10. Nunca importar `passwordHashMock` como secreto real.

## Campos Legacy Que Requieren Mapeo

- `clients.amount` -> `clients.agreedPrice`
- `projects.startDate` -> `projects.startsAt`
- `projects.dueDate` -> `projects.dueAt`
- `subscriptions.renewalDate` -> `subscriptions.renewsAt`
- `movements.category` -> `categories.name`
- `movements.type = salida` -> `gasto`
- `invoices.status = pagada` -> `pagada`

## Invariantes A Proteger

- Cliente puede existir sin proyecto.
- Proyecto requiere cliente.
- Factura requiere cliente; proyecto opcional.
- Pago requiere cliente; factura/proyecto opcional durante migracion.
- Movimiento puede no estar asociado a cliente/proyecto.
- Todo borrado futuro debe ser soft delete con `deletedAt`.
- Dashboard debe poder calcularse desde PostgreSQL sin leer `localStorage`.
