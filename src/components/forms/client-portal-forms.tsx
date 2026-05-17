import { createClientPortalItemAction } from "@/server/actions/client-portal-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SelectOption = { id: string; label: string };

export function ClientPortalItemForm({ clients }: { clients: SelectOption[] }) {
  return (
    <form action={createClientPortalItemAction} className="grid gap-3">
      <Label>Cliente<EntitySelect name="clientId" options={clients} /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Titulo<Input name="title" required placeholder="Aprobacion de home" /></Label>
        <Label>Tipo<Input name="type" required placeholder="aprobacion, archivo, mensaje, entrega" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Estado<PortalStatusSelect /></Label>
        <Label>Link<Input name="link" placeholder="https://..." /></Label>
      </div>
      <Label>Mensaje visible para cliente<Textarea name="notes" /></Label>
      <Button>Publicar item</Button>
    </form>
  );
}

function PortalStatusSelect() {
  return (
    <Select name="status" defaultValue="visible">
      <option value="visible">Visible</option>
      <option value="oculto">Oculto</option>
      <option value="archivado">Archivado</option>
    </Select>
  );
}

function EntitySelect({ name, options }: { name: string; options: SelectOption[] }) {
  return (
    <Select name={name} required>
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.label}</option>
      ))}
    </Select>
  );
}
