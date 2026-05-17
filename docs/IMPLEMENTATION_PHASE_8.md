# Fase 8 - Portal Cliente

## Alcance implementado

- `/client-portal` deja de ser placeholder y pasa a ser una vista funcional.
- Usuarios internos con permisos pueden publicar items visibles para clientes.
- Usuarios con rol `cliente` solo ven clientes asociados a su email de sesion.
- La consulta del portal excluye datos internos: rentabilidad, costos, movimientos de caja, notas internas y rendimiento del equipo.
- El portal muestra avance de proyectos, tareas en revision, documentos compartidos, facturas, pagos pendientes y mantenimiento publicado.

## Nuevos archivos

- `src/server/queries/client-portal.ts`
- `src/server/actions/client-portal-actions.ts`
- `src/components/forms/client-portal-forms.tsx`

## Pantalla activada

- `/client-portal`

## Regla de seguridad aplicada

- Rol `cliente`: acceso limitado por coincidencia de email con `Client.email`.
- Roles internos autorizados: administran items publicados y pueden previsualizar portales.
- El portal usa una query propia para evitar reusar fichas internas que exponen costos, rentabilidad, movimientos o notas privadas.

## Pendientes de refactor profundo

- Agregar `User.clientId` o tabla de membresias para asociar clientes de forma robusta.
- Crear ruta publica/tokenizada por cliente si se necesita acceso sin login interno.
- Agregar comentarios o solicitudes de cambios desde cliente.
- Separar documentos internos de documentos compartidos con un flag explicito.
- Agregar aprobaciones firmables con fecha, responsable interno y evidencia.
