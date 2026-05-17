import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function AgendaPage() {
  return (
    <ModulePlaceholder
      moduleKey="agenda"
      focus={["Entregas de proyectos", "Vencimientos de facturas", "Reuniones y tareas", "Proximas acciones CRM"]}
      nextStep="Crear una consulta de eventos unificada que derive fechas desde proyectos, facturas, pagos, tareas, suscripciones y oportunidades."
    />
  );
}
