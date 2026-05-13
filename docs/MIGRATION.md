# Migracion A Backend

La app actual usa `localStorage` para mantener compatibilidad con Live Server. Esta estructura ya permite migrar por partes.

## Paso 1: Mantener Contratos De Datos

Conservar campos actuales:

- `schemaVersion`
- `id`
- `userId`
- `createdAt`
- `updatedAt`
- relaciones por `clientId`, `projectId`, `invoiceId`

## Paso 2: Reemplazar Storage

Cambiar `js/storage.js` por una capa de servicios:

- `loadState()` -> llamadas `GET /api/...`
- `saveState()` -> acciones por entidad, no guardado global
- `exportSnapshot()` -> endpoint de backup
- `importSnapshot()` -> endpoint de restore controlado

Antes de migrar, conservar temporalmente `migrateSnapshot()` para importar backups viejos hacia la base real.

## Paso 3: Separar Servicios Por Dominio

Crear servicios futuros:

- `clientsService`
- `projectsService`
- `financeService`
- `billingService`
- `tasksService`
- `calendarService`
- `reportsService`
- `settingsService`

## Paso 4: Auth Real

Reemplazar auth mock por sesiones reales. Mantener roles:

- `admin`
- `finanzas`
- `solo_lectura`

## Paso 5: Auditoria Real

Mover `activityLogs` a base de datos y registrar:

- usuario actor
- accion
- entidad
- entidad afectada
- fecha
- metadata

## Paso 6: Archivos

Los documentos actuales guardan links. Para archivos reales, usar storage externo y conservar en la entidad:

- `name`
- `type`
- `url`
- `clientId`
- `projectId`
- `tags`

## Recomendacion

Migrar primero `auth`, `clients`, `projects`, `invoices` y `payments`. Despues avanzar con tareas, calendario, documentos y reportes.
