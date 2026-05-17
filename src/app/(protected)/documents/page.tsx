import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function DocumentsPage() {
  return (
    <ModulePlaceholder
      moduleKey="documents"
      focus={["Presupuestos", "Facturas", "Contratos", "Briefs e informes"]}
      nextStep="Crear plantillas por tipo de documento y asociarlas a cliente, proyecto, factura, presupuesto o pago."
    />
  );
}
