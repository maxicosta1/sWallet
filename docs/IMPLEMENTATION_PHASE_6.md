# Fase 6 - CRM, Marketing, Agenda y Alertas

## Alcance implementado

- CRM funcional en Next con pipeline visual por estado, formulario de oportunidad y cambio rapido de etapa.
- Marketing funcional con campanas, metricas de embudo, tasas de respuesta/reunion/cierre y pipeline conectado.
- Agenda operativa unificada con eventos manuales y fechas derivadas desde facturas, proyectos, tareas y suscripciones.
- Alertas inteligentes centralizadas para facturas vencidas, clientes sin seguimiento, proyectos en riesgo, tareas criticas, oportunidades quietas, renovaciones y soporte.
- Conexion Prisma entre `MarketingCampaign` y `Opportunity` mediante `campaignId`.

## Nuevos archivos

- `src/server/queries/commercial.ts`
- `src/server/actions/commercial-actions.ts`
- `src/components/forms/commercial-forms.tsx`
- `prisma/migrations/20260516152000_commercial_pipeline/migration.sql`

## Pantallas activadas

- `/crm`
- `/marketing`
- `/agenda`
- `/alerts`

## Regla funcional

Las oportunidades siguen siendo parte del eje Cliente -> Proyecto -> Dinero:

- Pueden asociarse a cliente, campana y responsable de equipo.
- Pueden medirse por valor, moneda y probabilidad.
- Pueden alimentar el pipeline comercial y las metricas de marketing.
- Las alertas detectan oportunidades sin movimiento para forzar una proxima accion.

## Pendientes de refactor profundo

- Agregar etapas CRM mas granulares si se decide migrar el enum (`presupuesto_enviado`, `aprobado`, `rechazado`).
- Convertir oportunidades ganadas en presupuesto/proyecto desde la ficha CRM.
- Guardar fecha especifica de proxima accion comercial en lugar de texto libre.
- Crear vistas detalle de campana y oportunidad.
- Llevar alertas al dashboard ejecutivo como widget reutilizable.
