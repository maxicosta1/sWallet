import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createClientAction,
  createMovementAction,
  createPaymentAction,
  createProjectAction,
  createSubscriptionAction,
  updateExchangeRateAction
} from "@/server/actions/finance-actions";

type SelectOption = { id: string; label: string };

export function ClientForm() {
  return (
    <form action={createClientAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Nombre<Input name="name" required placeholder="Lucia Fernandez" /></Label>
        <Label>Empresa<Input name="company" required placeholder="Norte Lab" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Email<Input name="email" type="email" required placeholder="cliente@empresa.com" /></Label>
        <Label>Teléfono<Input name="phone" required placeholder="+54..." /></Label>
      </div>
      <Label>Servicio<Input name="service" required placeholder="Sitio web, ecommerce, mantenimiento..." /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Precio<Input name="agreedPrice" type="number" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
        <Label>Estado<ClientStatusSelect /></Label>
      </div>
      <Label>Inicio<Input name="startDate" type="date" /></Label>
      <Label>Observaciones<Textarea name="observations" placeholder="Notas comerciales internas" /></Label>
      <Button>Crear cliente</Button>
    </form>
  );
}

export function PaymentForm({ clients }: { clients: SelectOption[] }) {
  return (
    <form action={createPaymentAction} className="grid gap-3">
      <Label>Cliente<EntitySelect name="clientId" options={clients} /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Monto<Input name="amount" type="number" step="0.01" required /></Label>
        <Label>Pagado<Input name="paidAmount" type="number" step="0.01" defaultValue="0" /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Fecha<Input name="date" type="date" required /></Label>
        <Label>Vencimiento<Input name="dueDate" type="date" required /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Estado<PaymentStatusSelect /></Label>
        <Label>Método<PaymentMethodSelect /></Label>
      </div>
      <Label>Notas<Textarea name="notes" /></Label>
      <Button>Registrar pago</Button>
    </form>
  );
}

export function MovementForm({ categories }: { categories: SelectOption[] }) {
  return (
    <form action={createMovementAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Tipo<Select name="type"><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option><option value="inversion">Inversión</option></Select></Label>
        <Label>Categoría<EntitySelect name="categoryId" options={categories} /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Monto<Input name="amount" type="number" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <Label>Fecha<Input name="date" type="date" required /></Label>
      <Label>Descripción<Textarea name="description" required /></Label>
      <Button>Registrar movimiento</Button>
    </form>
  );
}

export function ProjectForm({ clients }: { clients: SelectOption[] }) {
  return (
    <form action={createProjectAction} className="grid gap-3">
      <Label>Cliente<EntitySelect name="clientId" options={clients} /></Label>
      <Label>Proyecto<Input name="name" required placeholder="Web premium, ecommerce, app..." /></Label>
      <Label>Descripción<Textarea name="description" /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Estado<Select name="status"><option value="pendiente">Pendiente</option><option value="en_progreso">En progreso</option><option value="revision">Revisión</option><option value="entregado">Entregado</option><option value="pausado">Pausado</option></Select></Label>
        <Label>Progreso<Input name="progress" type="number" min="0" max="100" defaultValue="0" /></Label>
        <Label>Entrega<Input name="dueAt" type="date" /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Presupuesto<Input name="budget" type="number" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <Button>Crear proyecto</Button>
    </form>
  );
}

export function SubscriptionForm() {
  return (
    <form action={createSubscriptionAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Nombre<Input name="name" required placeholder="Vercel Pro" /></Label>
        <Label>Proveedor<Input name="provider" required placeholder="Vercel" /></Label>
      </div>
      <Label>Categoría<Input name="category" required placeholder="hosting, dominios, APIs..." /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Costo mensual<Input name="monthlyCost" type="number" step="0.01" required /></Label>
        <Label>Costo anual<Input name="annualCost" type="number" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Renovación<Input name="renewsAt" type="date" required /></Label>
        <Label>Estado<Select name="status"><option value="activa">Activa</option><option value="por_vencer">Por vencer</option><option value="vencida">Vencida</option><option value="cancelada">Cancelada</option></Select></Label>
      </div>
      <Button>Crear suscripción</Button>
    </form>
  );
}

export function ExchangeRateForm({ rate }: { rate: number }) {
  return (
    <form action={updateExchangeRateAction} className="flex gap-2">
      <Input name="rate" type="number" step="0.01" defaultValue={rate} />
      <Button>Actualizar</Button>
    </form>
  );
}

function CurrencySelect() {
  return <Select name="currency" defaultValue="ARS"><option value="ARS">ARS</option><option value="USD">USD</option></Select>;
}

function ClientStatusSelect() {
  return (
    <Select name="status" defaultValue="lead">
      <option value="lead">Lead</option>
      <option value="interesado">Interesado</option>
      <option value="activo">Activo</option>
      <option value="en_desarrollo">En desarrollo</option>
      <option value="mantenimiento">Mantenimiento</option>
      <option value="finalizado">Finalizado</option>
    </Select>
  );
}

function PaymentStatusSelect() {
  return <Select name="status" defaultValue="pendiente"><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="vencido">Vencido</option><option value="cancelado">Cancelado</option></Select>;
}

function PaymentMethodSelect() {
  return <Select name="method" defaultValue="transferencia"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mercadopago">Mercado Pago</option><option value="paypal">PayPal</option><option value="wise">Wise</option><option value="stripe">Stripe</option><option value="otro">Otro</option></Select>;
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
