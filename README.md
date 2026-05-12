# sWallet

Sistema interno estatico para administrar sCode Digital Solutions desde Live Server.

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

## Modulos

Dashboard, Clientes, CRM/Ventas, Proyectos, Finanzas, Pagos, Facturacion, Presupuestos, Calendario, Administracion, Tareas, Metas, Documentos, Soporte, Equipo, Marketing, Portal Cliente, Movimientos, Reportes, Suscripciones y Configuracion.

## Flujo Basico

1. Crear cliente en `Clientes`.
2. Crear proyecto asociado en `Proyectos`.
3. Registrar facturas en `Facturacion` y cobros en `Pagos`.
4. Organizar trabajo en `Tareas`, `Administracion`, `Calendario` y `CRM`.
5. Revisar estado general en `Dashboard` y `Reportes`.

## Futuro Backend

Las colecciones ya estan separadas por dominio y guardan `userId`. Para migrar a backend, reemplazar `js/storage.js` por servicios HTTP/API manteniendo la misma forma de datos.
