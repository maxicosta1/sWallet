import { createTaskAction, createTeamMemberAction, createTimeEntryAction, updateTaskStatusAction } from "@/server/actions/operations-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SelectOption = { id: string; label: string };

export function TeamMemberForm() {
  return (
    <form action={createTeamMemberAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Nombre<Input name="name" required placeholder="Agustin" /></Label>
        <Label>Apellido<Input name="lastName" placeholder="Pernil" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Email<Input name="email" type="email" required placeholder="persona@scode.com" /></Label>
        <Label>Telefono<Input name="phone" placeholder="+598..." /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Rol<Input name="role" required placeholder="Project Manager, Dev, Marketing..." /></Label>
        <Label>Estado<TeamStatusSelect /></Label>
      </div>
      <Label>Foco<Input name="focus" placeholder="Frontend, operaciones, ventas..." /></Label>
      <Label>Responsabilidades<Textarea name="responsibilities" /></Label>
      <Label>Notas internas<Textarea name="notes" /></Label>
      <Button>Crear persona</Button>
    </form>
  );
}

export function TaskForm({
  clients,
  projects,
  teamMembers
}: {
  clients: SelectOption[];
  projects: SelectOption[];
  teamMembers: SelectOption[];
}) {
  return (
    <form action={createTaskAction} className="grid gap-3">
      <Label>Titulo<Input name="title" required placeholder="QA mobile de checkout" /></Label>
      <Label>Descripcion<Textarea name="description" /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<OptionalEntitySelect name="clientId" options={clients} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
      <Label>Responsable<OptionalEntitySelect name="responsibleTeamMemberId" options={teamMembers} placeholder="Sin responsable" /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Prioridad<PrioritySelect /></Label>
        <Label>Estado<TaskStatusSelect /></Label>
        <Label>Fecha limite<Input name="dueDate" type="date" /></Label>
      </div>
      <Label>Comentarios<Textarea name="comments" /></Label>
      <Button>Crear tarea</Button>
    </form>
  );
}

export function TimeEntryForm({
  teamMembers,
  projects,
  tasks
}: {
  teamMembers: SelectOption[];
  projects: SelectOption[];
  tasks: SelectOption[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createTimeEntryAction} className="grid gap-3">
      <Label>Persona<EntitySelect name="teamMemberId" options={teamMembers} /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
        <Label>Tarea<OptionalEntitySelect name="taskId" options={tasks} /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Fecha<Input name="date" type="date" defaultValue={today} required /></Label>
        <Label>Horas<Input name="hours" type="number" step="0.25" min="0.25" required /></Label>
      </div>
      <Label>Comentario<Textarea name="comment" /></Label>
      <Button>Registrar horas</Button>
    </form>
  );
}

export function TaskStatusForm({ taskId, status }: { taskId: string; status: string }) {
  return (
    <form action={updateTaskStatusAction} className="flex gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <Select name="status" defaultValue={status} className="h-9 rounded-xl text-xs">
        <option value="pendiente">Pendiente</option>
        <option value="en_proceso">En proceso</option>
        <option value="en_revision">En revision</option>
        <option value="bloqueada">Bloqueada</option>
        <option value="completada">Completada</option>
        <option value="cancelada">Cancelada</option>
      </Select>
      <Button size="sm" variant="ghost">Guardar</Button>
    </form>
  );
}

function TeamStatusSelect() {
  return (
    <Select name="status" defaultValue="activo">
      <option value="activo">Activo</option>
      <option value="inactivo">Inactivo</option>
      <option value="invitado">Invitado</option>
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

function TaskStatusSelect() {
  return (
    <Select name="status" defaultValue="pendiente">
      <option value="pendiente">Pendiente</option>
      <option value="en_proceso">En proceso</option>
      <option value="en_revision">En revision</option>
      <option value="bloqueada">Bloqueada</option>
      <option value="completada">Completada</option>
      <option value="cancelada">Cancelada</option>
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
