# Plan Tecnico De Migracion Backend

## Alcance Fase 1

Fase 1 prepara base tecnica sin cambiar comportamiento del frontend.

Incluye:

- Documentar contrato actual de `localStorage`.
- Ampliar schema Prisma para cubrir dominio completo.
- Crear backend Express aislado.
- Crear configuracion de entorno backend.
- Crear estructura modular para crecer por dominio.
- Mantener Next.js y app estatica intactos.

No incluye:

- Reemplazar `localStorage`.
- Migrar formularios.
- Conectar frontend al backend.
- Borrar Next.js.
- Rehacer UI.
- Implementar auth completa.

## Arquitectura Objetivo

```text
frontend actual
  index.html / js/*
  src/app Next parcial (se conserva temporalmente)

backend/
  src/
    app.ts
    server.ts
    config/
    db/
    middlewares/
    modules/
      auth/
      users/
      clients/
      projects/
      billing/
      payments/
      movements/
      tasks/
      goals/
      dashboard/
      settings/
      audit/
    shared/

prisma/
  schema.prisma
  seed.ts
```

## Backend Fase 1

Express queda listo con:

- JSON body limitado.
- CORS configurable.
- Helmet.
- Logging HTTP.
- Healthcheck.
- Rutas placeholder por modulo.
- Middleware de errores.
- Prisma client compartido.

Las rutas placeholder devuelven `501 Not Implemented`. Esto evita falsa sensacion de API completa.

## Fases Futuras

### Fase 2 - Auth Real

Estado: implementada en backend aislado. Todavia no conectada al frontend.

Objetivo: usuarios reales, hash seguro, JWT, refresh tokens, roles.

Archivos esperados:

- `backend/src/modules/auth/*`
- `backend/src/modules/users/*`
- `prisma/schema.prisma`

Validacion:

- Registro admin controlado.
- Login con bcrypt/argon2.
- `GET /auth/me`.
- Middleware `requireAuth`.
- Rate limit en login.

Endpoints base:

- `POST /api/v1/auth/bootstrap`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `POST /api/v1/users`

### Fase 3 - Clientes Y Proyectos

Estado: implementada en backend aislado. Todavia no conectada al frontend.

Objetivo: CRUD real para entidades nucleo.

Validacion:

- Crear cliente.
- Editar cliente.
- Crear proyecto asociado.
- Listar con paginacion/filtros.
- Verificar frontend viejo intacto.

Endpoints base:

- `GET /api/v1/clients`
- `GET /api/v1/clients/:id`
- `POST /api/v1/clients`
- `PATCH /api/v1/clients/:id`
- `DELETE /api/v1/clients/:id`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

### Fase 4 - Facturacion, Pagos Y Movimientos

Objetivo: mover datos financieros al backend.

Validacion:

- Totales ARS/USD iguales a fixture local.
- Vencidos calculados igual.
- Facturas y pagos vinculados.
- Auditoria por alta/edicion.

### Fase 5 - Dashboard Y Reportes

Objetivo: metricas centralizadas.

Validacion:

- Dashboard no depende de datos hardcodeados.
- Reportes exportables.
- Consultas indexadas.

### Fase 6 - Modulos Secundarios

Objetivo: tareas, metas, calendario, documentos, soporte, marketing, portal.

Validacion:

- CRUD por modulo.
- Filtros actuales preservados.
- Soft delete.
- Activity log.

### Fase 7 - Corte De LocalStorage

Objetivo: `localStorage` deja de ser fuente principal.

Validacion:

- Importador legacy probado.
- Backup JSON antiguo importable.
- Frontend usa API.
- Rollback documentado.

## Riesgos

- Doble runtime Next + Express puede confundir scripts. Mitigacion: backend aislado con package propio.
- Schema ampliado puede exponer deuda del seed actual. Mitigacion: no hacer migracion DB automatica en Fase 1.
- Estados legacy no coinciden con enums limpios. Mitigacion: enums aceptan valores actuales y migrador normaliza luego.
- Auth mock no debe convivir como auth real. Mitigacion: documentar reset de password y no importar `passwordHashMock`.

## Validaciones De Fase 1

- `npm run validate:static`
- `node --check app.js`
- `node --check js/auth.js`
- `node --check js/events.js`
- `node --check js/finance.js`
- `node --check js/render.js`
- `node --check js/state.js`
- `node --check js/storage.js`
- `npm run typecheck` si dependencias estan instaladas
- `npx prisma validate` si Prisma esta disponible
- `cd backend && npm run typecheck` si dependencias backend estan instaladas

## Criterio De Exito

- Frontend actual sigue ejecutando desde Live Server.
- Next.js no se elimina.
- No cambia shape runtime de `localStorage`.
- Prisma describe el dominio completo.
- Backend tiene estructura escalable, pero no toma control de la app.
