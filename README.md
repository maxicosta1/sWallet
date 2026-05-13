# sWallet

Sistema interno estatico para administrar sCode Digital Solutions desde Live Server.

> Fase 3 backend: el frontend actual sigue funcionando igual. La carpeta `backend/` ya tiene auth real y CRUD de clientes/proyectos en Express + PostgreSQL, pero todavia no reemplaza `localStorage`.

## Ejecutar

Abrir `index.html` con Live Server. La primera vez muestra registro de admin; luego se accede con el usuario creado. Los datos se guardan en `localStorage` bajo `scodeFinanceApp`.

## Estructura

- `index.html`: layout, vistas y formularios.
- `style.css`: tema claro sCode, componentes, responsive y modales.
- `app.js`: inicializador.
- `js/state.js`: estado, modelos locales y datos demo.
- `js/storage.js`: persistencia local.
- `js/auth.js`: auth mock, sesion y roles.
- `js/finance.js`: calculos, filtros, busqueda y alertas.
- `js/render.js`: render de vistas, tablas, cards, graficos y resets.
- `js/events.js`: eventos, validaciones, CRUD y exportacion CSV.

Documentacion ampliada:

- `docs/ARCHITECTURE.md`: arquitectura actual, capas y criterios de mantenimiento.
- `docs/MODULES.md`: mapa funcional de modulos y relaciones.
- `docs/MIGRATION.md`: ruta para migrar de `localStorage` a backend.
- `docs/QA.md`: checklist de pruebas manuales y comandos de verificacion.

## Modulos

Dashboard, Clientes, CRM/Ventas, Proyectos, Finanzas, Pagos, Facturacion, Presupuestos, Calendario, Administracion, Tareas, Metas, Documentos, Soporte, Equipo, Marketing, Portal Cliente, Movimientos, Reportes, Suscripciones y Configuracion.

## Automatizaciones Locales

El dashboard calcula automaticamente agenda de hoy, pagos vencidos, tareas vencidas, proyectos atrasados, renovaciones proximas, presupuestos por vencer e insights de reportes. Desde CRM y Presupuestos se pueden crear proyectos asociados al cliente.

## Filtros Y Acciones Rapidas

CRM, Presupuestos, Documentos, Soporte y Marketing tienen filtros propios por cliente, estado, tipo y busqueda. Los presupuestos se pueden duplicar, marcar como enviados/rechazados, convertir en proyecto e imprimir como vista PDF desde el navegador.

## Configuracion Y Backup

En `Configuracion` se editan los datos de empresa, color principal, monedas, servicios, categorias financieras y dias de recordatorio. Tambien se puede exportar un backup JSON completo e importar uno anterior para restaurar `localStorage`.

## Usuarios Y Roles

El admin puede crear usuarios mock con roles `admin`, `finanzas` y `solo_lectura`, cambiar rol/estado y eliminar accesos. Los usuarios inactivos no pueden iniciar sesion.

## Auditoria

Cada alta, edicion, eliminacion o cambio relevante ejecutado desde la UI queda registrado en `activityLogs`. El historial se ve en `Configuracion` y el admin puede limpiarlo.

## Validaciones

Los formularios validan campos obligatorios, emails, URLs, montos minimos/maximos, fechas coherentes, clientes/proyectos relacionados y duplicados clave como clientes por email, proyectos por nombre, facturas por numero y suscripciones por nombre.

## Flujo Basico

1. Crear cliente en `Clientes`.
2. Crear proyecto asociado en `Proyectos`.
3. Registrar facturas en `Facturacion` y cobros en `Pagos`.
4. Organizar trabajo en `Tareas`, `Administracion`, `Calendario` y `CRM`.
5. Revisar estado general en `Dashboard` y `Reportes`.

## Futuro Backend

Las colecciones ya estan separadas por dominio y guardan `userId`. Para migrar a backend, reemplazar `js/storage.js` por servicios HTTP/API manteniendo la misma forma de datos.

La base local usa `schemaVersion` y migraciones automaticas en `js/storage.js`, asi que los backups viejos se normalizan al cargar/importar.

Documentacion tecnica nueva:

- `docs/LOCAL_STORAGE_CONTRACT.md`: shape actual de `scodeFinanceApp` y entidades detectadas.
- `docs/BACKEND_MIGRATION_PLAN.md`: arquitectura objetivo, fases y validaciones.
- `backend/README.md`: backend Express inicial, aislado del frontend.

## Verificacion Tecnica

```bash
npm run validate:static
node --check app.js
node --check js/auth.js
node --check js/events.js
node --check js/finance.js
node --check js/render.js
node --check js/state.js
node --check js/storage.js
```
