# sWallet Backend

Backend Express inicial para la base MySQL/MariaDB compartida. El frontend estatico consume estas rutas por API.

## Comandos

```bash
cd backEnd
npm install
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run dev
```

## Estructura

```text
src/
  app.ts
  server.ts
  config/env.ts
  db/prisma.ts
  middlewares/
  modules/
  shared/
```

## Rutas

- `GET /health`: estado del proceso.
- `GET /health/db`: verifica conexion Prisma/MySQL.
- `GET /api/v1`: lista de modulos.
- `POST /api/v1/auth/login`: devuelve access token y refresh token.
- `POST /api/v1/auth/refresh`: rota refresh token.
- `POST /api/v1/auth/logout`: revoca refresh token.
- `GET /api/v1/auth/me`: usuario actual.
- `GET /api/v1/users`: lista usuarios, solo `admin`.
- `POST /api/v1/users`: crea usuario, solo `admin`.
- `GET /api/v1/clients`: lista clientes con paginacion y filtros.
- `GET /api/v1/clients/:id`: detalle de cliente.
- `POST /api/v1/clients`: crea cliente, roles `admin`, `finanzas`, `desarrollador`.
- `PATCH /api/v1/clients/:id`: edita cliente.
- `DELETE /api/v1/clients/:id`: archiva cliente, solo `admin`.
- `GET /api/v1/projects`: lista proyectos con paginacion y filtros.
- `GET /api/v1/projects/:id`: detalle de proyecto.
- `POST /api/v1/projects`: crea proyecto asociado a cliente.
- `PATCH /api/v1/projects/:id`: edita proyecto.
- `DELETE /api/v1/projects/:id`: archiva proyecto, solo `admin`.
- `GET /api/v1/<module>`: placeholder `501` para modulos no migrados.

## Modulos Preparados

- `auth`
- `users`
- `clients`
- `projects`
- `billing`
- `payments`
- `movements`
- `tasks`
- `goals`
- `dashboard`
- `settings`
- `audit`

## Notas

- Auth backend basica ya existe con JWT y refresh token persistido.
- El login publico no registra usuarios: solo acepta los usuarios configurados en `ALLOWED_LOGIN_USERS` con `ALLOWED_LOGIN_PASSWORD`.
- Clientes y proyectos ya tienen CRUD real en backend.
- Los demas endpoints de dominio siguen como placeholders.
- Prisma usa `../prisma/schema.prisma` como schema compartido.
- El frontend estatico ya llama al backend para auth, clientes y proyectos.
