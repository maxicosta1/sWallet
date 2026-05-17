import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createBudgetAction,
  createClientAction,
  createInvoiceAction,
  createInvoicePaymentAction,
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
        <Label>Telefono<Input name="phone" required placeholder="+54..." /></Label>
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

export function InvoiceForm({ clients, projects }: { clients: SelectOption[]; projects: SelectOption[] }) {
  return (
    <form action={createInvoiceAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<EntitySelect name="clientId" options={clients} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Numero<Input name="number" placeholder="Auto: FAC-000001" /></Label>
        <Label>Moneda<CurrencySelect /></Label>
        <Label>Estado<InvoiceStatusSelect /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Emision<Input name="issueDate" type="date" required /></Label>
        <Label>Vencimiento<Input name="dueDate" type="date" required /></Label>
      </div>
      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <span className="text-xs font-black uppercase text-muted-foreground">Items</span>
        {[0, 1, 2].map((index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_110px_140px]">
            <Input name="itemDescription" required={index === 0} placeholder={index === 0 ? "Desarrollo web" : "Item opcional"} />
            <Input name="itemQuantity" type="number" step="0.01" min="0" defaultValue={index === 0 ? "1" : ""} placeholder="Cant." />
            <Input name="itemUnitPrice" type="number" step="0.01" min="0" placeholder="Precio" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Descuento<Input name="discount" type="number" step="0.01" min="0" defaultValue="0" /></Label>
        <Label>Impuestos<Input name="taxes" type="number" step="0.01" min="0" defaultValue="0" /></Label>
      </div>
      <Label>Notas<Textarea name="notes" placeholder="Condiciones comerciales o instrucciones de pago" /></Label>
      <Button>Crear factura</Button>
    </form>
  );
}

export function BudgetForm({ clients, projects }: { clients: SelectOption[]; projects: SelectOption[] }) {
  return (
    <form action={createBudgetAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Cliente<OptionalEntitySelect name="clientId" options={clients} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Numero<Input name="number" placeholder="Auto: PRE-000001" /></Label>
        <Label>Moneda<CurrencySelect /></Label>
        <Label>Estado<BudgetStatusSelect /></Label>
      </div>
      <Label>Titulo<Input name="projectName" required placeholder="Web institucional premium" /></Label>
      <Label>Servicios incluidos<Textarea name="services" placeholder="Alcance comercial, entregables y condiciones principales" /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Emision<Input name="issueDate" type="date" /></Label>
        <Label>Validez<Input name="validUntil" type="date" /></Label>
      </div>
      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <span className="text-xs font-black uppercase text-muted-foreground">Items</span>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_110px_140px]">
            <Input name="budgetItemDescription" required={index === 0} placeholder={index === 0 ? "Diseno y desarrollo web" : "Item opcional"} />
            <Input name="budgetItemQuantity" type="number" step="0.01" min="0" defaultValue={index === 0 ? "1" : ""} placeholder="Cant." />
            <Input name="budgetItemUnitPrice" type="number" step="0.01" min="0" placeholder="Precio" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Descuento<Input name="discount" type="number" step="0.01" min="0" defaultValue="0" /></Label>
        <Label>Impuestos<Input name="taxes" type="number" step="0.01" min="0" defaultValue="0" /></Label>
      </div>
      <Label>Notas comerciales<Textarea name="notes" placeholder="Validez, forma de pago, revisiones incluidas o condiciones" /></Label>
      <Button>Crear presupuesto</Button>
    </form>
  );
}

export function PaymentForm({
  clients,
  projects = [],
  invoices = [],
  categories = []
}: {
  clients: SelectOption[];
  projects?: SelectOption[];
  invoices?: SelectOption[];
  categories?: SelectOption[];
}) {
  return (
    <form action={createPaymentAction} className="grid gap-3">
      <Label>Cliente<EntitySelect name="clientId" options={clients} /></Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Factura<OptionalEntitySelect name="invoiceId" options={invoices} /></Label>
        <Label>Proyecto<OptionalEntitySelect name="projectId" options={projects} /></Label>
      </div>
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
        <Label>Metodo<PaymentMethodSelect /></Label>
      </div>
      <Label>Categoria de movimiento<OptionalEntitySelect name="categoryId" options={categories} placeholder="Auto: ingresos" /></Label>
      <Label>Notas<Textarea name="notes" /></Label>
      <Button>Registrar pago</Button>
    </form>
  );
}

export function InvoicePaymentForm({
  invoice,
  categories = []
}: {
  invoice: { id: string; balanceDue: number; currency: "ARS" | "USD"; dueDate: Date };
  categories?: SelectOption[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createInvoicePaymentAction} className="grid gap-3">
      <input type="hidden" name="invoiceId" value={invoice.id} />
      <input type="hidden" name="currency" value={invoice.currency} />
      <input type="hidden" name="status" value="pagado" />
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Monto<Input name="amount" type="number" step="0.01" min="0" defaultValue={invoice.balanceDue} required /></Label>
        <Label>Pagado<Input name="paidAmount" type="number" step="0.01" min="0" defaultValue={invoice.balanceDue} required /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Fecha<Input name="date" type="date" defaultValue={today} required /></Label>
        <Label>Vencimiento<Input name="dueDate" type="date" defaultValue={invoice.dueDate.toISOString().slice(0, 10)} required /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Metodo<PaymentMethodSelect /></Label>
        <Label>Categoria<OptionalEntitySelect name="categoryId" options={categories} placeholder="Auto: ingresos" /></Label>
      </div>
      <Label>Notas<Textarea name="notes" defaultValue="Pago registrado desde factura" /></Label>
      <Button>Registrar pago recibido</Button>
    </form>
  );
}

export function MovementForm({ categories }: { categories: SelectOption[] }) {
  return (
    <form action={createMovementAction} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Tipo<Select name="type"><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option><option value="inversion">Inversion</option></Select></Label>
        <Label>Categoria<EntitySelect name="categoryId" options={categories} /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Monto<Input name="amount" type="number" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <Label>Fecha<Input name="date" type="date" required /></Label>
      <Label>Descripcion<Textarea name="description" required /></Label>
      <Button>Registrar movimiento</Button>
    </form>
  );
}

export function ProjectForm({ clients }: { clients: SelectOption[] }) {
  return (
    <form action={createProjectAction} className="grid gap-3">
      <Label>Cliente<EntitySelect name="clientId" options={clients} /></Label>
      <Label>Proyecto<Input name="name" required placeholder="Web premium, ecommerce, app..." /></Label>
      <Label>Descripcion<Textarea name="description" /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Estado<Select name="status"><option value="pendiente">Pendiente</option><option value="en_progreso">En progreso</option><option value="revision">Revision</option><option value="entregado">Entregado</option><option value="pausado">Pausado</option></Select></Label>
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
      <Label>Categoria<Input name="category" required placeholder="hosting, dominios, APIs..." /></Label>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>Costo mensual<Input name="monthlyCost" type="number" step="0.01" required /></Label>
        <Label>Costo anual<Input name="annualCost" type="number" step="0.01" required /></Label>
        <Label>Moneda<CurrencySelect /></Label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>Renovacion<Input name="renewsAt" type="date" required /></Label>
        <Label>Estado<Select name="status"><option value="activa">Activa</option><option value="por_vencer">Por vencer</option><option value="vencida">Vencida</option><option value="cancelada">Cancelada</option></Select></Label>
      </div>
      <Button>Crear suscripcion</Button>
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

function InvoiceStatusSelect() {
  return (
    <Select name="status" defaultValue="pendiente">
      <option value="borrador">Borrador</option>
      <option value="pendiente">Pendiente</option>
      <option value="enviada">Enviada</option>
      <option value="vencida">Vencida</option>
      <option value="cancelada">Cancelada</option>
    </Select>
  );
}

function BudgetStatusSelect() {
  return (
    <Select name="status" defaultValue="borrador">
      <option value="borrador">Borrador</option>
      <option value="enviado">Enviado</option>
      <option value="aprobado">Aprobado</option>
      <option value="rechazado">Rechazado</option>
      <option value="vencido">Vencido</option>
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
