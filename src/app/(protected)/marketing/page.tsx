import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function MarketingPage() {
  return (
    <ModulePlaceholder
      moduleKey="marketing"
      focus={["Campanas", "Contactos y respuestas", "Reuniones", "Ventas cerradas"]}
      nextStep="Relacionar campanas con oportunidades CRM para medir tasa de respuesta, cierre e ingresos generados."
    />
  );
}
