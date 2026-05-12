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
      className="bank-card-surface relative min-h-[330px] overflow-hidden rounded-[2rem] border border-white/20 p-6 shadow-glass md:p-8"
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0_42%,rgba(255,255,255,.14)_48%,transparent_56%)] opacity-70" />
      <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-24 -right-28 h-64 w-96 rounded-full bg-primary/35 blur-3xl" />
      <div className="relative z-10 flex items-start justify-between gap-5">
        <div>
          <span className="text-sm font-bold text-white/70">Available balance</span>
          <h2 className="mt-3 break-words text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
            {formatCurrency(balance, "ARS")}
          </h2>
        </div>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 shadow-2xl ring-1 ring-white/30">
          <CreditCard className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="relative z-10 mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-white shadow-glow">
        Cuenta operativa sCode
        <ArrowUpRight className="h-4 w-4" />
      </div>

      <div className="relative z-10 mt-12 grid grid-cols-3 gap-4">
        <div>
          <span className="block text-xs font-bold text-white/65">ARS</span>
          <strong className="mt-1 block break-words text-white">{formatCurrency(ars, "ARS")}</strong>
        </div>
        <div>
          <span className="block text-xs font-bold text-white/65">USD</span>
          <strong className="mt-1 block break-words text-white">{formatCurrency(usd, "USD")}</strong>
        </div>
        <div>
          <span className="block text-xs font-bold text-white/65">TC</span>
          <strong className="mt-1 block break-words text-white">{formatCurrency(exchangeRate, "ARS")}</strong>
        </div>
      </div>
    </motion.article>
  );
}
