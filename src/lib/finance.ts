import type { Currency } from "@prisma/client";

export function convertToARS(amount: number, currency: Currency | "ARS" | "USD", exchangeRate: number) {
  return currency === "USD" ? amount * exchangeRate : amount;
}

export function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
