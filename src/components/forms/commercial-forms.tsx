import {
  createCalendarEventAction,
  createMarketingCampaignAction,
  createOpportunityAction,
  updateCalendarEventStatusAction,
  updateOpportunityStatusAction
} from "@/server/actions/commercial-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SelectOption = { id: string; label: string };

export function OpportunityForm({
  clients,
  campaigns,
  teamMembers
}: {
  clients: SelectOption[];
  campaigns: SelectOption[];
  teamMembers: SelectOption[];
}) {
  return (
    <form action={createOpportunityAction} className="grid gap-3">
      <Label>Titulo<Input name="title" required placeholder="Web institucional para estudio contable" /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<OptionalEntitySelect name="clientId" options={clients} placeholder="Prospecto sin ficha" /></Label>
        <Label>Campana<OptionalEntitySelect name="campaignId" options={campaigns} placeholder="Sin campana" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Servicio<Input name="service" required placeholder="Landing page, ecommerce, sistema..." /></Label>
        <Label>Responsable<OptionalEntitySelect name="responsibleTeamMemberId" options={teamMembers} placeholder="Sin responsable" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Label>Valor<Input name="value" type="number" min="0" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
        <Label>Probabilidad<Input name="probability" type="number" min="0" max="100" defaultValue="25" required /></Label>
        <Label>Estado<OpportunityStatusSelect /></Label>
      </div>
      <Label>Proxima accion<Input name="nextAction" placeholder="Enviar propuesta, llamar, agendar reunion..." /></Label>
      <Label>Notas<Textarea name="notes" /></Label>
      <Button>Crear oportunidad</Button>
    </form>
  );
}

export function OpportunityStatusForm({ opportunityId, status }: { opportunityId: string; status: string }) {
  return (
    <form action={updateOpportunityStatusAction} className="flex gap-2">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <OpportunityStatusSelect defaultValue={status} className="h-9 rounded-xl text-xs" />
      <Button size="sm" variant="ghost">Guardar</Button>
    </form>
  );
}

export function MarketingCampaignForm() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createMarketingCampaignAction} className="grid gap-3">
      <Label>Nombre<Input name="name" required placeholder="Outbound ecommerce mayo" /></Label>
      <Label>Rubro objetivo<Input name="target" required placeholder="Tiendas online, estudios, profesionales..." /></Label>
      <Label>Mensaje usado<Textarea name="message" required /></Label>
      <div className="grid gap-3 md:grid-cols-4">
        <Label>Contactos<Input name="contacts" type="number" min="0" defaultValue="0" /></Label>
        <Label>Respuestas<Input name="responses" type="number" min="0" defaultValue="0" /></Label>
        <Label>Reuniones<Input name="meetings" type="number" min="0" defaultValue="0" /></Label>
        <Label>Ventas<Input name="sales" type="number" min="0" defaultValue="0" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Estado<Input name="status" required defaultValue="activa" /></Label>
        <Label>Fecha<Input name="date" type="date" required defaultValue={today} /></Label>
      </div>
      <Button>Crear campana</Button>
    </form>
  );
}

export function CalendarEventForm({ clients, projects }: { clients: SelectOption[]; projects: SelectOption[] }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createCalendarEventAction} className="grid gap-3">
      <Label>Titulo<Input name="title" required placeholder="Reunion de seguimiento" /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<OptionalEntitySelect name="clientId" options={clients} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Label>Tipo<Input name="type" required placeholder="reunion, entrega, pago..." /></Label>
        <Label>Fecha<Input name="date" type="date" required defaultValue={today} /></Label>
        <Label>Inicio<Input name="startTime" type="time" /></Label>
        <Label>Fin<Input name="endTime" type="time" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Prioridad<PrioritySelect /></Label>
        <Label>Estado<CalendarStatusSelect /></Label>
      </div>
      <Label>Descripcion<Textarea name="description" /></Label>
      <Button>Crear evento</Button>
    </form>
  );
}

export function CalendarEventStatusForm({ eventId, status }: { eventId: string; status: string }) {
  return (
    <form action={updateCalendarEventStatusAction} className="flex gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <CalendarStatusSelect defaultValue={status} className="h-9 rounded-xl text-xs" />
      <Button size="sm" variant="ghost">Guardar</Button>
    </form>
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

function OpportunityStatusSelect({ defaultValue = "nuevo", className }: { defaultValue?: string; className?: string }) {
  return (
    <Select name="status" defaultValue={defaultValue} className={className}>
      <option value="nuevo">Lead nuevo</option>
      <option value="contacto">Contactado</option>
      <option value="reunion_agendada">Reunion agendada</option>
      <option value="negociacion">Negociacion</option>
      <option value="ganado">Ganado</option>
      <option value="perdido">Perdido</option>
    </Select>
  );
}

function PrioritySelect() {
  return (
    <Select name="priority" defaultValue="media">
      <option value="baja">Baja</option>
      <option value="media">Media</option>
      <option value="alta">Alta</option>
      <option value="urgente">Urgente</option>
    </Select>
  );
}

function CalendarStatusSelect({ defaultValue = "pendiente", className }: { defaultValue?: string; className?: string }) {
  return (
    <Select name="status" defaultValue={defaultValue} className={className}>
      <option value="pendiente">Pendiente</option>
      <option value="confirmado">Confirmado</option>
      <option value="completado">Completado</option>
      <option value="cancelado">Cancelado</option>
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
