# Implementacion Fase 3

Este corte mejora el flujo de facturacion para operar una factura completa desde sWallet.

## Cambios realizados

- Las facturas pueden generarse sin numero manual; sWallet asigna `FAC-000001`, `FAC-000002`, etc.
- `/billing/[id]` muestra una ficha de factura con plantilla imprimible.
- La plantilla incluye datos de sCode, cliente, proyecto, fechas, items, subtotal, descuento, impuestos, total, pagado y saldo pendiente.
- La ficha de factura permite registrar un pago recibido directamente desde la factura.
- El pago contextual hereda cliente, proyecto, moneda y factura, y mantiene la regla de generar movimiento de ingreso.
- El listado de `/billing` ahora enlaza al detalle de factura en lugar de la ficha del cliente.

## Regla de operacion

- Crear factura genera documento de cobro.
- Registrar pago desde factura crea `Payment` y `Movement`.
- La factura recalcula su saldo y estado despues del pago.
- La impresion usa `window.print()` sobre una vista preparada para papel.

## Pendiente para el siguiente corte

1. Mejorar plantilla con datos comerciales configurables desde `CompanySettings`.
2. Agregar accion de anular factura con confirmacion.
3. Agregar `pagada_parcial` o un indicador visual de pago parcial.
4. Agregar descarga PDF real si se necesita archivo persistente.
5. Implementar presupuestos con conversion a factura/proyecto.
