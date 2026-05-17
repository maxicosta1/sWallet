ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'cliente';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'bloqueada';

DO $$ BEGIN
  CREATE TYPE "ProjectStage" AS ENUM (
    'relevamiento',
    'diseno',
    'desarrollo',
    'revision_interna',
    'revision_cliente',
    'correcciones',
    'entrega',
    'mantenimiento'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectRisk" AS ENUM (
    'normal',
    'en_riesgo',
    'atrasado',
    'bloqueado_cliente',
    'bloqueado_interno'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "approvedBudgetId" TEXT,
  ADD COLUMN IF NOT EXISTS "responsibleTeamMemberId" TEXT,
  ADD COLUMN IF NOT EXISTS "stage" "ProjectStage" NOT NULL DEFAULT 'relevamiento',
  ADD COLUMN IF NOT EXISTS "risk" "ProjectRisk" NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS "scope" JSONB;

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "budgetId" TEXT,
  ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxes" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "balanceDue" DECIMAL(14, 2) NOT NULL DEFAULT 0;

UPDATE "Invoice"
SET
  "subtotal" = CASE WHEN "subtotal" = 0 THEN "amount" ELSE "subtotal" END,
  "total" = CASE WHEN "total" = 0 THEN "amount" ELSE "total" END,
  "balanceDue" = CASE WHEN "balanceDue" = 0 AND "status" <> 'pagada' THEN "amount" ELSE "balanceDue" END;

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "budgetId" TEXT;

ALTER TABLE "Movement"
  ADD COLUMN IF NOT EXISTS "paymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;

ALTER TABLE "AdminTask"
  ADD COLUMN IF NOT EXISTS "responsibleTeamMemberId" TEXT;

ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "responsibleTeamMemberId" TEXT;

ALTER TABLE "Opportunity"
  ADD COLUMN IF NOT EXISTS "responsibleTeamMemberId" TEXT;

ALTER TABLE "TeamMember"
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "responsibilities" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE TABLE IF NOT EXISTS "TimeEntry" (
  "id" TEXT NOT NULL,
  "teamMemberId" TEXT NOT NULL,
  "projectId" TEXT,
  "taskId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "hours" DECIMAL(10, 2) NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Project_approvedBudgetId_key" ON "Project"("approvedBudgetId");
CREATE UNIQUE INDEX IF NOT EXISTS "Movement_paymentId_key" ON "Movement"("paymentId");

CREATE INDEX IF NOT EXISTS "Project_approvedBudgetId_idx" ON "Project"("approvedBudgetId");
CREATE INDEX IF NOT EXISTS "Project_responsibleTeamMemberId_idx" ON "Project"("responsibleTeamMemberId");
CREATE INDEX IF NOT EXISTS "Project_stage_idx" ON "Project"("stage");
CREATE INDEX IF NOT EXISTS "Project_risk_idx" ON "Project"("risk");
CREATE INDEX IF NOT EXISTS "Invoice_budgetId_idx" ON "Invoice"("budgetId");
CREATE INDEX IF NOT EXISTS "Payment_budgetId_idx" ON "Payment"("budgetId");
CREATE INDEX IF NOT EXISTS "Movement_invoiceId_idx" ON "Movement"("invoiceId");
CREATE INDEX IF NOT EXISTS "AdminTask_responsibleTeamMemberId_idx" ON "AdminTask"("responsibleTeamMemberId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_responsibleTeamMemberId_idx" ON "ServiceRequest"("responsibleTeamMemberId");
CREATE INDEX IF NOT EXISTS "Opportunity_responsibleTeamMemberId_idx" ON "Opportunity"("responsibleTeamMemberId");
CREATE INDEX IF NOT EXISTS "TimeEntry_teamMemberId_idx" ON "TimeEntry"("teamMemberId");
CREATE INDEX IF NOT EXISTS "TimeEntry_projectId_idx" ON "TimeEntry"("projectId");
CREATE INDEX IF NOT EXISTS "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");
CREATE INDEX IF NOT EXISTS "TimeEntry_date_idx" ON "TimeEntry"("date");

ALTER TABLE "Project" ADD CONSTRAINT "Project_approvedBudgetId_fkey"
  FOREIGN KEY ("approvedBudgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_responsibleTeamMemberId_fkey"
  FOREIGN KEY ("responsibleTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_budgetId_fkey"
  FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_budgetId_fkey"
  FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Movement" ADD CONSTRAINT "Movement_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Movement" ADD CONSTRAINT "Movement_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_responsibleTeamMemberId_fkey"
  FOREIGN KEY ("responsibleTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_responsibleTeamMemberId_fkey"
  FOREIGN KEY ("responsibleTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_responsibleTeamMemberId_fkey"
  FOREIGN KEY ("responsibleTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_teamMemberId_fkey"
  FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "AdminTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
