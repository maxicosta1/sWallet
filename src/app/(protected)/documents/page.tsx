import Link from "next/link";
import type * as React from "react";
import { getDocumentsSupportData } from "@/server/queries/documents-support";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DocumentForm } from "@/components/forms/documents-support-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const data = await getDocumentsSupportData();
  const byType = data.documents.reduce<Record<string, number>>((acc, document) => {
    acc[document.type] = (acc[document.type] ?? 0) + 1;
    return acc;
  }, {});
  const linked = data.documents.filter((document) => document.projectName || document.clientName !== "Sin cliente").length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Documentos" value={data.documents.length} />
        <Metric label="Asociados" value={linked} />
        <Metric label="Tipos activos" value={Object.keys(byType).length} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Documentacion</CardDescription>
              <CardTitle>Nuevo documento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DocumentForm clients={data.clients} projects={data.projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardDescription>Biblioteca</CardDescription>
              <CardTitle>Documentos asociados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Documento", "Tipo", "Cliente", "Proyecto", "Actualizado", "Link"]}
              rows={data.documents.map((document) => [
                <div key="name" className="grid gap-1">
                  <strong>{document.name}</strong>
                  {document.tags ? <span className="text-xs text-muted-foreground">{document.tags}</span> : null}
                </div>,
                <StatusBadge key="type" status={document.type} />,
                document.clientName,
                document.projectName ?? "Sin proyecto",
                formatDate(document.updatedAt),
                document.link && document.link !== "#" ? (
                  <Link key="link" href={document.link} className="font-bold text-primary">
                    Abrir
                  </Link>
                ) : (
                  "Sin link"
                )
              ])}
              empty="Todavia no hay documentos cargados."
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardDescription>Plantillas</CardDescription>
            <CardTitle>Estructura imprimible por tipo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.documents.slice(0, 9).map((document) => (
              <article key={document.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-sm text-white">{document.name}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">{document.clientName}</span>
                  </div>
                  <Badge>{document.type}</Badge>
                </div>
                <div className="grid gap-2">
                  {document.templateSections.map((section) => (
                    <div key={section} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-muted-foreground">
                      {section}
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {!data.documents.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
                Crea un documento para ver su estructura imprimible sugerida.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
        <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
      </CardContent>
    </Card>
  );
}
