import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function GoalsPage() {
  return (
    <ModulePlaceholder
      moduleKey="goals"
      focus={["Metas mensuales", "Ingresos y ganancia", "Clientes nuevos", "Proyectos finalizados"]}
      nextStep="Conectar metas con metricas reales de facturacion, movimientos, CRM y proyectos completados."
    />
  );
}
