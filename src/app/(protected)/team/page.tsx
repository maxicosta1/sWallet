import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function TeamPage() {
  return (
    <ModulePlaceholder
      moduleKey="team"
      focus={["Ficha individual", "Proyectos asignados", "Tareas asignadas", "Registro de horas"]}
      nextStep="Convertir TeamMember en la fuente de responsables para tareas, proyectos, oportunidades y horas trabajadas."
    />
  );
}
