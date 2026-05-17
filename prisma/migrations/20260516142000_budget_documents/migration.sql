ALTER TABLE "Budget"
  ADD COLUMN IF NOT EXISTS "number" TEXT,
  ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxes" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "BudgetItem"
  ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(10, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total" DECIMAL(14, 2) NOT NULL DEFAULT 0;

UPDATE "BudgetItem"
SET
  "unitPrice" = CASE WHEN "unitPrice" = 0 THEN "amount" ELSE "unitPrice" END,
  "total" = CASE WHEN "total" = 0 THEN "amount" ELSE "total" END;

UPDATE "Budget"
SET
  "subtotal" = item_totals.total,
  "total" = GREATEST(item_totals.total - "Budget"."discount" + "Budget"."taxes", 0)
FROM (
  SELECT "budgetId", COALESCE(SUM("total"), 0) AS total
  FROM "BudgetItem"
  GROUP BY "budgetId"
) AS item_totals
WHERE "Budget"."id" = item_totals."budgetId";

CREATE UNIQUE INDEX IF NOT EXISTS "Budget_number_key" ON "Budget"("number");
CREATE INDEX IF NOT EXISTS "Budget_number_idx" ON "Budget"("number");
