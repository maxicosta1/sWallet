# QA Y Pruebas

## Comandos

```bash
npm run validate:static
node --check app.js
node --check js/auth.js
node --check js/events.js
node --check js/finance.js
node --check js/render.js
node --check js/state.js
node --check js/storage.js
git diff --check
```

`npm run validate:static` revisa la version Live Server: sintaxis JS, IDs duplicados, referencias `dom.*` inexistentes y entrada `index.html` con `app.js` como modulo.

## Smoke Test

1. Abrir `index.html` con Live Server.
2. Registrar admin inicial.
3. Cerrar sesion.
4. Volver a iniciar sesion.
5. Navegar todas las secciones.
6. Recargar y confirmar persistencia.

## Flujos Criticos

- Crear cliente.
- Crear proyecto asociado al cliente.
- Crear factura asociada al cliente y opcionalmente al proyecto.
- Registrar pago.
- Crear tarea con vencimiento.
- Crear evento de calendario.
- Crear presupuesto y convertirlo en proyecto.
- Ver facturacion agrupada por cliente.
- Filtrar facturacion por proyecto.
- Exportar CSV.
- Exportar backup JSON e importarlo.
- Revisar `Configuracion > Persistencia` y confirmar diagnostico de datos en OK.

## Responsive

Probar:

- Desktop ancho.
- Notebook.
- Tablet.
- Mobile.

Validar:

- sidebar desktop visible.
- sidebar mobile colapsable.
- cards sin solaparse.
- tablas scrolleables horizontalmente.
- modales legibles.
- botones sin texto cortado.

## Accesibilidad Basica

Validar:

- `Escape` cierra modales.
- `Tab` y `Shift + Tab` no sacan el foco del modal abierto.
- al cerrar un modal, el foco vuelve al boton que lo abrio.
- cada modal anuncia su titulo mediante `aria-labelledby`.
- los formularios marcan visualmente campos invalidos.

## Roles

- `admin`: puede crear, editar, eliminar y administrar usuarios.
- `finanzas`: puede operar modulos financieros permitidos.
- `solo_lectura`: no debe ver acciones de escritura ni borrado.

## Datos

Validar que no se permita:

- proyecto sin cliente.
- factura sin cliente.
- proyecto asociado a cliente incorrecto.
- email invalido.
- URL invalida.
- montos negativos.
- factura duplicada por numero.
- cliente duplicado por email.
