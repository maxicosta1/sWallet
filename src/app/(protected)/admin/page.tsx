import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function AdminPage() {
  return (
    <ModulePlaceholder
      moduleKey="admin"
      focus={["Pedidos de cliente", "Notas internas", "Proximas acciones", "Historial operativo"]}
      nextStep="Ordenar administracion como soporte transversal a clientes y proyectos, sin duplicar tareas ni CRM."
    />
  );
}
