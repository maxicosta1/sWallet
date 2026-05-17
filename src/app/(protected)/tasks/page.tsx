import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function TasksPage() {
  return (
    <ModulePlaceholder
      moduleKey="tasks"
      focus={["Kanban por estado", "Responsable desde Equipo", "Horas estimadas y reales", "Progreso automatico de proyecto"]}
      nextStep="Reemplazar responsables de texto por responsibleId y calcular avance desde tareas completadas o etapas aprobadas."
    />
  );
}
