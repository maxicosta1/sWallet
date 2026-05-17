# Implementacion Fase 5

Este corte activa Tareas, Equipo y Registro de Horas.

## Cambios realizados

- `/tasks` ahora tiene alta de tareas y tablero por estado.
- Las tareas pueden asociarse a cliente, proyecto y responsable desde `TeamMember`.
- Las tareas usan prioridad, estado y fecha limite.
- El estado de una tarea se puede actualizar desde el tablero.
- Al cambiar tareas de proyecto, sWallet recalcula el progreso del proyecto segun tareas completadas.
- `/team` ahora permite crear personas del equipo.
- `/team` permite registrar horas por persona, proyecto y tarea.
- El panel de equipo muestra proyectos, tareas pendientes, completadas y horas registradas.

## Reglas aplicadas

- Los responsables ya no necesitan escribirse como texto libre en las tareas nuevas: se seleccionan desde Equipo.
- El progreso de proyecto se calcula desde tareas operativas asociadas.
- Las horas quedan imputadas a persona y opcionalmente a proyecto/tarea para usar luego en rentabilidad.

## Pendiente para el siguiente corte

1. Ficha individual de persona del equipo.
2. Reportes de carga de trabajo y rentabilidad con costo interno.
3. Alertas por tareas vencidas y bloqueadas.
4. Mejorar kanban con drag and drop si se justifica.
5. Migrar responsables legacy de texto a `responsibleTeamMemberId`.
