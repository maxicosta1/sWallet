import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function ClientPortalPage() {
  return (
    <ModulePlaceholder
      moduleKey="client-portal"
      focus={["Avance visible", "Documentos compartidos", "Facturas y pagos", "Aprobaciones del cliente"]}
      nextStep="Separar permisos de cliente y crear consultas que excluyan rentabilidad, costos internos, notas privadas y datos de otros clientes."
    />
  );
}
