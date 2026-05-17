# Fase 9 - Reportes avanzados y busqueda global

## Alcance implementado

- `/reports` pasa a usar una query propia de analytics, separada del dashboard.
- La caja real se calcula desde `Movement`, manteniendo la regla de evitar doble conteo con pagos.
- Se agrega busqueda global por `q` sobre clientes, proyectos, facturas, presupuestos, pagos, tareas, documentos, equipo y CRM.
- El buscador del header envia consultas a `/reports?q=...`.
- Se agregan filtros guardados visibles:
  - Clientes con deuda.
  - Facturas vencidas.
  - Tareas urgentes.
- Se agregan reportes de:
  - Ingresos, egresos y ganancia neta.
  - Deuda total y facturas vencidas.
  - Pipeline ponderado.
  - Rentabilidad por cliente.
  - Rentabilidad por proyecto.
  - Horas y rendimiento de equipo.
  - Conversion de campanas.

## Nuevos archivos

- `src/server/queries/reports-advanced.ts`

## Archivos modificados

- `src/app/(protected)/reports/page.tsx`
- `src/components/layout/app-shell.tsx`

## Reglas funcionales

- Los reportes de caja salen de movimientos confirmados.
- Las deudas salen de facturas con saldo pendiente.
- La busqueda global no expone datos sensibles del portal cliente, solo rutas internas protegidas.

## Pendientes de refactor profundo

- Agregar filtros persistentes por usuario.
- Crear detalle drill-down por reporte.
- Agregar exportacion por seccion, no solo movimientos.
- Crear comparativas por periodo configurable.
- Integrar busqueda global con atajo de teclado y resultados instantaneos.
