import type { Currency } from "@prisma/client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CurrencyAmount({
  value,
  currency,
  className
}: {
  value: number;
  currency: Currency | "ARS" | "USD";
  className?: string;
}) {
  return <span className={cn("tabular-nums", className)}>{formatCurrency(value, currency)}</span>;
}
