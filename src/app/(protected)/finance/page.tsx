import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function FinancePage() {
  return (
    <ModulePlaceholder
      moduleKey="finance"
      focus={["Caja real", "Pendiente de cobro", "Gastos", "Proyeccion mensual"]}
      nextStep="Consolidar reportes financieros para que la caja salga de movimientos confirmados y la deuda salga de facturas menos pagos."
    />
  );
}
