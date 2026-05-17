"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function BankBalanceCard({
  balance,
  ars,
  usd,
  exchangeRate
}: {
  balance: number;
  ars: number;
  usd: number;
  exchangeRate: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="virtual-card-surface relative min-h-[330px] rounded-[1.75rem] p-5 md:p-8"
    >
      <div className="relative z-10 flex items-start justify-between gap-5">
        <div>
          <span className="text-sm font-black text-black/62">Saldo disponible</span>
          <h2 className="mt-3 break-words text-5xl font-black leading-none tracking-normal text-black md:text-7xl">
            {formatCurrency(balance, "ARS")}
          </h2>
        </div>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-black/15 shadow-2xl ring-1 ring-black/10">
          <CreditCard className="h-7 w-7 text-black" />
        </div>
      </div>

      <div className="relative z-10 mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-5 font-black text-white shadow-glass">
        Cuenta operativa sCode
        <ArrowUpRight className="h-4 w-4" />
      </div>

      <div className="relative z-10 mt-12 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-black/12 p-3">
          <span className="block text-xs font-black text-black/55">ARS</span>
          <strong className="mt-1 block break-words text-black">{formatCurrency(ars, "ARS")}</strong>
        </div>
        <div className="rounded-2xl bg-black/12 p-3">
          <span className="block text-xs font-black text-black/55">USD</span>
          <strong className="mt-1 block break-words text-black">{formatCurrency(usd, "USD")}</strong>
        </div>
        <div className="rounded-2xl bg-black/12 p-3">
          <span className="block text-xs font-black text-black/55">TC</span>
          <strong className="mt-1 block break-words text-black">{formatCurrency(exchangeRate, "ARS")}</strong>
        </div>
      </div>
    </motion.article>
  );
}
