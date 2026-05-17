import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function SupportPage() {
  return (
    <ModulePlaceholder
      moduleKey="support"
      focus={["Planes mensuales", "Dominios", "Hosting", "Renovaciones y SSL"]}
      nextStep="Separar mantenimiento, dominios y hosting para generar alertas automaticas y cargos recurrentes."
    />
  );
}
