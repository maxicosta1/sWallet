# Implementacion Fase 4

Este corte convierte Presupuestos en un modulo operativo dentro de Next.

## Cambios realizados

- `/budgets` ahora permite crear presupuestos con cliente, proyecto opcional, numero automatico, items, descuento, impuestos, moneda, validez, estado y notas.
- Se agrego numeracion automatica `PRE-000001`, `PRE-000002`, etc.
- `/budgets/[id]` muestra una plantilla imprimible de presupuesto profesional.
- El detalle de presupuesto permite convertir un presupuesto en proyecto.
- El detalle de presupuesto permite convertir un presupuesto en factura.
- La conversion a factura copia items, totales, moneda, cliente, proyecto y notas.
- La conversion a proyecto crea un proyecto asociado al cliente y vincula el presupuesto aprobado.
- El schema Prisma suma totales de presupuesto e items con cantidad/precio unitario sin eliminar campos legacy.

## Regla comercial aplicada

- `Budget` representa la propuesta comercial.
- Un presupuesto aprobado puede convertirse en factura, proyecto, o ambos.
- Si se convierte, el estado queda como `aprobado`.
- Si no tiene cliente asociado, no se habilitan conversiones.

## Pendiente para el siguiente corte

1. Agregar selector de servicios/plantillas comerciales.
2. Mejorar CRM para crear presupuestos desde oportunidades.
3. Agregar seguimiento de presupuestos enviados sin respuesta.
4. Agregar indicador visual de presupuesto vencido.
5. Evitar conversiones duplicadas con confirmaciones y estados mas estrictos.
