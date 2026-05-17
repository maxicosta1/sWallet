# Fase 7 - Documentos y Soporte

## Alcance implementado

- `/documents` deja de ser placeholder y pasa a ser biblioteca funcional.
- `/support` deja de ser placeholder y pasa a controlar planes de mantenimiento, dominios, hosting y renovaciones.
- Documentos se asocian con cliente y proyecto mediante IDs relacionales.
- Soporte se asocia con cliente y proyecto, registra plan mensual, dominio, hosting y vencimientos.
- Se agregan estructuras imprimibles sugeridas por tipo de documento.
- Los vencimientos de soporte quedan disponibles para alertas y agenda a traves de queries centralizadas.

## Nuevos archivos

- `src/server/queries/documents-support.ts`
- `src/server/actions/documents-support-actions.ts`
- `src/components/forms/documents-support-forms.tsx`

## Pantallas activadas

- `/documents`
- `/support`

## Reglas funcionales

- Documentos no guardan secretos ni contrasenas: solo nombre, tipo, link, etiquetas y descripcion.
- Los planes de soporte pueden existir sin proyecto, pero se recomienda asociarlos a cliente y proyecto cuando correspondan.
- Los vencimientos dentro de 30 dias se muestran como alertas de renovacion.

## Pendientes de refactor profundo

- Crear vistas detalle e imprimibles reales por tipo de documento.
- Agregar entidades especificas para dominio, hosting y SSL si se requiere granularidad.
- Convertir planes de soporte en suscripciones/facturas recurrentes.
- Conectar documentos con factura, presupuesto y pago por IDs directos.
- Agregar permisos finos para documentos internos versus documentos visibles en portal cliente.
