import { createDocumentAction, createSupportPlanAction } from "@/server/actions/documents-support-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SelectOption = { id: string; label: string };

export function DocumentForm({ clients, projects }: { clients: SelectOption[]; projects: SelectOption[] }) {
  return (
    <form action={createDocumentAction} className="grid gap-3">
      <Label>Nombre<Input name="name" required placeholder="Contrato web institucional" /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Tipo<DocumentTypeSelect /></Label>
        <Label>Link<Input name="link" placeholder="https://..." /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<OptionalEntitySelect name="clientId" options={clients} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
      <Label>Etiquetas<Input name="tags" placeholder="legal, aprobacion, entregable" /></Label>
      <Label>Descripcion<Textarea name="description" /></Label>
      <Button>Crear documento</Button>
    </form>
  );
}

export function SupportPlanForm({ clients, projects }: { clients: SelectOption[]; projects: SelectOption[] }) {
  return (
    <form action={createSupportPlanAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<OptionalEntitySelect name="clientId" options={clients} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
      <Label>URL<Input name="url" placeholder="https://cliente.com" /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Dominio<Input name="domain" required placeholder="cliente.com" /></Label>
        <Label>Hosting<Input name="hosting" required placeholder="Vercel, DonWeb, Hostinger..." /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Vence dominio<Input name="domainRenewal" type="date" /></Label>
        <Label>Vence hosting<Input name="hostingRenewal" type="date" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Plan<Input name="plan" required placeholder="Mantenimiento mensual" /></Label>
        <Label>Precio mensual<Input name="monthlyPrice" type="number" min="0" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <Label>Estado<Input name="status" required defaultValue="activo" /></Label>
      <Label>Notas<Textarea name="notes" /></Label>
      <Button>Crear soporte</Button>
    </form>
  );
}

function DocumentTypeSelect() {
  return (
    <Select name="type" defaultValue="propuesta">
      <option value="propuesta">Presupuesto / propuesta</option>
      <option value="factura">Factura</option>
      <option value="contrato">Contrato</option>
      <option value="brief">Brief</option>
      <option value="recurso">Informe / recurso</option>
      <option value="otro">Otro</option>
    </Select>
  );
}

function CurrencySelect() {
  return (
    <Select name="currency" defaultValue="ARS">
      <option value="ARS">ARS</option>
      <option value="USD">USD</option>
    </Select>
  );
}

function OptionalEntitySelect({ name, options, placeholder = "Sin asociar" }: { name: string; options: SelectOption[]; placeholder?: string }) {
  return (
    <Select name={name}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.label}</option>
      ))}
    </Select>
  );
}
