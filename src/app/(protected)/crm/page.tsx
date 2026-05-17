import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function CrmPage() {
  return (
    <ModulePlaceholder
      moduleKey="crm"
      focus={["Pipeline visual", "Valor estimado", "Probabilidad", "Proxima accion comercial"]}
      nextStep="Migrar oportunidades del legacy a tablas Prisma y conectar cada oportunidad con cliente, campana, responsable y presupuesto."
    />
  );
}
