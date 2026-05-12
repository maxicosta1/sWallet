# sCode Finance OS

Aplicación SaaS interna para administrar finanzas y operaciones de sCode Digital Solutions.

## Stack

- Next.js App Router + TypeScript
- TailwindCSS + componentes estilo shadcn/ui
- Framer Motion
- Recharts
- Zustand
- Prisma ORM + PostgreSQL
- Auth.js con credenciales, sesiones y roles

## Ejecutar localmente

1. Instalar Node.js 20+ con npm.
2. Copiar `.env.example` a `.env`.
3. Levantar PostgreSQL:

```bash
docker compose up -d
```

4. Instalar dependencias y preparar base:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

5. Ingresar en `http://localhost:3000/login`.

Credenciales demo:

- `admin@scode.com`
- `admin123456`

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run db:studio
```

## Prototipo anterior

El prototipo HTML/CSS/JS vanilla quedó archivado en `legacy-static/`.
