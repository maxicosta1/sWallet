# Implementacion Fase 1

Este corte mueve la app Next hacia la arquitectura objetivo sin romper el legacy `/app`.

## Cambios realizados

- Se agrego `src/config/modules.ts` como registro central de modulos, grupos, rutas, permisos y estado.
- El shell de Next ahora renderiza la navegacion agrupada por Inicio, Clientes y ventas, Proyectos, Finanzas y Operacion interna.
- `middleware.ts` toma las rutas protegidas desde el registro central.
- Se agregaron pantallas base para modulos que existian en legacy pero no en Next: agenda, alertas, CRM, presupuestos, portal cliente, tareas, documentos, soporte, finanzas, facturacion, equipo, metas, marketing y administracion.
- Clientes y proyectos ahora tienen ficha individual en Next con relaciones operativas y financieras.
- El schema Prisma refuerza el flujo Cliente -> Proyecto -> Presupuesto -> Factura -> Pago -> Movimiento con relaciones opcionales compatibles.
- Se preparo `prisma/migrations/20260516131000_core_relations/migration.sql` para aplicar estos cambios en PostgreSQL.

## Compatibilidad

- `/app` sigue apuntando al HTML legacy.
- `AppSnapshot` y localStorage siguen disponibles para compatibilidad y recuperacion.
- Los campos legacy como `Project.responsible`, `Invoice.amount` y `Payment.paidAmount` se mantienen.

## Siguiente corte recomendado

1. Ejecutar `prisma migrate dev` o aplicar la migracion preparada y luego correr `prisma generate`.
2. Implementar acciones de facturacion real en `/billing`.
3. Cambiar registro de pagos para que un pago confirmado cree o vincule un movimiento.
4. Migrar responsables de texto a `TeamMember`.
5. Convertir las pantallas base planificadas en CRUDs por dominio.
