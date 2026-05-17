# Implementacion Fase 2

Este corte empieza a convertir el nucleo financiero en funcional dentro de Next.

## Cambios realizados

- `/billing` ahora permite crear facturas con cliente, proyecto opcional, items, descuento, impuestos, moneda, fechas y estado inicial.
- Se agrego `src/server/queries/billing.ts` para centralizar clientes, proyectos, facturas y categorias financieras usadas por facturacion y pagos.
- El formulario de pagos ahora puede asociarse a factura y proyecto.
- Si un pago se registra como `pagado`, la accion crea un `Movement` de tipo `ingreso`.
- Si el pago esta asociado a una factura, la accion recalcula `balanceDue` y estado de la factura.
- El dashboard evita doble conteo: pagos que ya tienen movimiento vinculado no se suman otra vez como caja.

## Regla financiera aplicada

- `Invoice` representa documento de cobro.
- `Payment` representa cobro esperado o recibido.
- `Movement` representa caja real.
- Un pago confirmado debe generar o vincular un movimiento de ingreso.
- Los reportes de caja deben priorizar movimientos y usar pagos pagados solo como respaldo legacy cuando no tienen movimiento.

## Pendiente para el siguiente corte

1. Agregar pantalla imprimible/PDF de factura.
2. Permitir crear pagos directamente desde una factura.
3. Agregar numero automatico de factura segun configuracion.
4. Implementar estado `pagada_parcial` si se decide ampliar el enum.
5. Migrar pagos legacy pagados para vincularlos con movimientos sin duplicar caja.
