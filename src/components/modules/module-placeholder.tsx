import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { appModules, type AppModule } from "@/config/modules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ModulePlaceholderProps = {
  moduleKey: string;
  focus: string[];
  nextStep: string;
};

export function ModulePlaceholder({ moduleKey, focus, nextStep }: ModulePlaceholderProps) {
  const module = appModules.find((item) => item.key === moduleKey);
  if (!module) return null;

  const related = relatedModules(module);

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>{moduleGroupLabel(module.group)}</CardDescription>
              <CardTitle className="text-2xl">{module.label}</CardTitle>
            </div>
            <Badge>{statusLabel(module.status)}</Badge>
          </CardHeader>
          <CardContent className="grid gap-5">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{module.description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {focus.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-white">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Implementacion</CardDescription>
              <CardTitle>Proximo paso</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground">
            <p>{nextStep}</p>
            {module.legacySection ? (
              <Button asChild variant="ghost">
                <Link href="/app">
                  Abrir legacy
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Flujo central</CardDescription>
            <CardTitle>Cliente a movimiento</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {["Cliente", "Proyecto", "Presupuesto", "Factura", "Pago", "Movimiento"].map((step, index, steps) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-sm font-black text-primary">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-white">{step}</span>
                {index < steps.length - 1 ? <ArrowRight className="ml-auto hidden h-4 w-4 text-muted-foreground xl:block" /> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {related.length ? (
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Modulos conectados</CardDescription>
              <CardTitle>Relaciones sugeridas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/40 hover:bg-primary/10"
              >
                <span className="text-sm font-black text-white">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function relatedModules(module: AppModule) {
  return appModules
    .filter((item) => item.key !== module.key && (item.group === module.group || item.status === "active"))
    .slice(0, 6);
}

function statusLabel(status: AppModule["status"]) {
  return {
    active: "Activo",
    foundation: "Base lista",
    planned: "Planificado"
  }[status];
}

function moduleGroupLabel(group: AppModule["group"]) {
  return {
    home: "Inicio",
    sales: "Clientes y ventas",
    projects: "Proyectos",
    finance: "Finanzas",
    operations: "Operacion interna"
  }[group];
}
