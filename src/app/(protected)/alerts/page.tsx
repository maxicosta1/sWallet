import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function AlertsPage() {
  return (
    <ModulePlaceholder
      moduleKey="alerts"
      focus={["Facturas vencidas", "Clientes sin seguimiento", "Proyectos en riesgo", "Tareas urgentes pendientes"]}
      nextStep="Centralizar reglas de alerta en servidor y reutilizarlas en Dashboard, Agenda y vistas detalle."
    />
  );
}
