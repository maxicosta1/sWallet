# Fase 10 - Seguridad, papelera, onboarding y QA

## Alcance implementado

- `/admin` deja de ser placeholder y pasa a ser panel operativo de administracion.
- Se agrega onboarding interno con el flujo recomendado de sWallet.
- Se agrega matriz de roles y modulos permitidos.
- Se agrega papelera basada en `deletedAt` para entidades criticas:
  - Clientes.
  - Proyectos.
  - Facturas.
  - Pagos.
  - Documentos.
  - Presupuestos.
  - Movimientos.
- Se agregan acciones admin para restaurar o eliminar definitivamente.
- La eliminacion definitiva exige escribir `ELIMINAR`.
- Se agregan checks de QA operativo:
  - Facturas vencidas.
  - Pagos pagados sin movimiento.
  - Tareas activas sin responsable.
  - Documentos sin link.
  - Items de portal no visibles.

## Nuevos archivos

- `src/server/queries/admin.ts`
- `src/server/actions/admin-actions.ts`
- `docs/IMPLEMENTATION_PHASE_10.md`

## Archivos modificados

- `src/app/(protected)/admin/page.tsx`
- `src/config/modules.ts`
- `src/lib/permissions.ts`

## Reglas funcionales

- Solo `admin` ve el modulo Administracion en la navegacion.
- Solo `admin` puede restaurar o eliminar definitivamente desde la papelera.
- La papelera aprovecha soft delete existente y no crea una segunda fuente de verdad.
- Los checks de QA no corrigen automaticamente; muestran pendientes para revision operativa.

## Pendientes recomendados para produccion

- Reemplazar autenticacion temporal por usuarios reales en base de datos.
- Agregar registro de actividad con usuario y fecha en cada restauracion/eliminacion.
- Agregar soft delete desde todas las pantallas con confirmacion previa.
- Ejecutar migraciones Prisma y typecheck en entorno con `npm`/`npx`.
- Hacer QA visual en navegador y responsive cuando el dev server pueda levantarse.
