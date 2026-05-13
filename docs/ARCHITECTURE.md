# Arquitectura De sWallet

sWallet es una aplicacion web estatica pensada para ejecutarse con Live Server. No requiere build, backend ni dependencias externas para funcionar.

## Capas

- `index.html`: define el shell, navegacion, vistas, modales y formularios.
- `style.css`: concentra el sistema visual claro de sCode, responsive, modales, tablas, cards y dashboard.
- `app.js`: arranque de la app. Carga datos, enlaza DOM, registra eventos y renderiza.
- `js/state.js`: modelo local, estado de UI, datos demo y factories.
- `js/storage.js`: persistencia en `localStorage`, exportacion e importacion de backup.
- `js/auth.js`: autenticacion mock, sesion persistente y permisos por rol.
- `js/finance.js`: selectores de datos, calculos, alertas, busqueda y resumenes.
- `js/render.js`: renderizado de vistas, tablas, tarjetas, graficos y resets de formularios.
- `js/events.js`: listeners, CRUD, validaciones, acciones inline y exportaciones.

Los modales se preparan desde `prepareModals()` en `js/events.js`: agregan rol dialog, `aria-modal`, `aria-labelledby`, cierre con Escape, retorno de foco y contencion de foco con Tab.

## Flujo De Arranque

1. `app.js` llama `loadState()`.
2. `bindDom()` indexa todos los elementos con `id`.
3. `syncAuthUI()` decide si mostrar login o app privada.
4. `bindEvents()` registra listeners.
5. `renderAll()` pinta la vista activa y datos derivados.

## Persistencia

Todo vive bajo la clave `scodeFinanceApp`. Las entidades operativas guardan `userId` para separar datos entre usuarios mock.

La persistencia incluye `schemaVersion`. Al cargar o importar backups, `js/storage.js` migra snapshots antiguos, inicializa colecciones faltantes y normaliza campos base como `createdAt`, `updatedAt`, estados legacy y relaciones opcionales.

## Roles

- `admin`: administra todo.
- `finanzas`: puede operar clientes, pagos, facturacion, movimientos y reportes.
- `solo_lectura`: visualiza sin crear, editar ni eliminar.

## Criterios De Mantenimiento

- No agregar logica nueva dentro de `index.html`.
- Mantener calculos en `finance.js`, no en `render.js`.
- Mantener validaciones y acciones en `events.js`.
- Si `render.js` o `events.js` siguen creciendo, dividir por dominio:
  - `render-dashboard.js`
  - `render-crm.js`
  - `render-operations.js`
  - `events-forms.js`
  - `events-actions.js`
- No romper la compatibilidad de datos existentes en `localStorage`.
- Subir `SCHEMA_VERSION` en `js/state.js` cuando cambie la forma persistida de datos.
