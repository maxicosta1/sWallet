import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExchangeRateForm } from "@/components/forms/entity-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getDashboardData();

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardDescription>Multimoneda</CardDescription>
            <CardTitle>Cotizacion USD/ARS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ExchangeRateForm rate={data.exchangeRate} />
          <p className="mt-3 text-sm text-muted-foreground">
            Cada actualizacion crea un registro historico para reportes y auditoria.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Roles</CardDescription>
            <CardTitle>Permisos disponibles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p><strong className="text-white">admin:</strong> acceso total.</p>
          <p><strong className="text-white">finanzas:</strong> clientes, pagos, movimientos y reportes.</p>
          <p><strong className="text-white">project_manager:</strong> proyectos, tareas, equipo operativo y portal cliente.</p>
          <p><strong className="text-white">desarrollador:</strong> proyectos y lectura operativa.</p>
          <p><strong className="text-white">marketing:</strong> CRM, campanas, clientes y reportes comerciales.</p>
          <p><strong className="text-white">solo lectura:</strong> navegacion y reportes sin escritura.</p>
          <p><strong className="text-white">cliente:</strong> acceso limitado al portal cliente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
