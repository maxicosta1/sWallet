import type * as React from "react";
import { getAdminData } from "@/server/queries/admin";
import { permanentlyDeleteTrashItemAction, restoreTrashItemAction } from "@/server/actions/admin-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminData();

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Rol actual" value={data.sessionRole.replaceAll("_", " ")} />
        <Metric label="Items en papelera" value={data.trash.length} />
        <Metric label="Checks con atencion" value={data.qaChecks.filter((check) => check.count > 0).length} />
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Onboarding interno</CardDescription>
            <CardTitle>Como se usa sWallet</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {data.onboardingSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <Badge>{String(index + 1).padStart(2, "0")}</Badge>
                <p className="mt-3 text-sm leading-6 text-white/85">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>QA operativo</CardDescription>
              <CardTitle>Checklist final</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.qaChecks.map((check) => (
                <article key={check.title} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-sm text-white">{check.title}</strong>
                    <StatusBadge status={check.status === "ok" ? "normal" : "alta"} />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{check.action}</p>
                  <strong className="text-2xl text-white">{check.count}</strong>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Roles y permisos</CardDescription>
              <CardTitle>Matriz de acceso</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Rol", "Modulos permitidos"]}
              rows={data.permissionMatrix.map((row) => [
                <StatusBadge key="role" status={row.role} />,
                <div key="modules" className="flex flex-wrap gap-2">
                  {row.modules.filter((module) => module.allowed).map((module) => (
                    <Badge key={module.module}>{module.module}</Badge>
                  ))}
                </div>
              ])}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Recuperacion</CardDescription>
            <CardTitle>Papelera</CardTitle>
          </div>
          {!data.isAdmin ? <Badge tone="red">solo admin</Badge> : null}
        </CardHeader>
        <CardContent>
          <DataTable
            headers={["Tipo", "Item", "Detalle", "Eliminado", "Acciones"]}
            rows={data.trash.map((item) => [
              item.type,
              item.title,
              item.detail,
              item.deletedAt ? formatDate(item.deletedAt) : "Sin fecha",
              data.isAdmin ? <TrashActions key={`${item.type}-${item.id}`} type={item.type} id={item.id} /> : "Sin permiso"
            ])}
            empty="La papelera esta vacia."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Seguridad aplicada</CardDescription>
            <CardTitle>Reglas vigentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SecurityRule title="Rutas protegidas" text="El middleware usa el registro central de modulos para proteger rutas internas." />
            <SecurityRule title="Permisos por rol" text="La navegacion y acciones criticas validan rol antes de escribir." />
            <SecurityRule title="Portal cliente" text="La consulta del portal excluye costos, rentabilidad, movimientos y notas internas." />
            <SecurityRule title="Papelera" text="La restauracion y eliminacion definitiva estan restringidas a admin." />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrashActions({ type, id }: { type: string; id: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={restoreTrashItemAction}>
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <Button size="sm">Restaurar</Button>
      </form>
      <form action={permanentlyDeleteTrashItemAction}>
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <input
          name="confirm"
          placeholder="ELIMINAR"
          className="mr-2 h-9 w-24 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-xs text-white outline-none placeholder:text-muted-foreground"
        />
        <Button size="sm" variant="danger">Eliminar</Button>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
        <strong className="mt-2 block text-xl font-black capitalize text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}

function SecurityRule({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <strong className="text-sm text-white">{title}</strong>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
