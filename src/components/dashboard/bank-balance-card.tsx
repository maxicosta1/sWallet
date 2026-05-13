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
      className="bank-card-surface relative min-h-[270px] overflow-hidden rounded-[1.75rem] border border-white/20 p-5 shadow-glass md:min-h-[330px] md:rounded-[2rem] md:p-8"
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0_42%,rgba(255,255,255,.14)_48%,transparent_56%)] opacity-70" />
      <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-24 -right-28 h-64 w-96 rounded-full bg-primary/35 blur-3xl" />

      <div className="relative z-10 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-[#111217]/65">Cuenta operativa</span>
            <p className="mt-1 text-lg font-black text-[#111217]">sCode Finance</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#111217]/90 shadow-2xl ring-1 ring-white/25">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="mt-16 rounded-[1.45rem] bg-[#101116] p-5 shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-bold text-white/55">Saldo disponible</span>
          <strong className="mt-3 block break-words text-right text-[clamp(1.75rem,9vw,2.45rem)] font-black leading-none tracking-normal text-white">
            {formatCurrency(balance, "ARS")}
          </strong>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-white">
          <MobileBalanceItem label="ARS" value={formatCurrency(ars, "ARS")} />
          <MobileBalanceItem label="USD" value={formatCurrency(usd, "USD")} />
          <MobileBalanceItem label="TC" value={formatCurrency(exchangeRate, "ARS")} />
        </div>
      </div>

      <div className="relative z-10 hidden md:block">
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="text-sm font-bold text-white/70">Saldo disponible</span>
            <h2 className="mt-3 break-words text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
              {formatCurrency(balance, "ARS")}
            </h2>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 shadow-2xl ring-1 ring-white/30">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-white shadow-glow">
          Cuenta operativa sCode
          <ArrowUpRight className="h-4 w-4" />
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4">
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
      </div>
    </motion.article>
  );
}

function MobileBalanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[#101116]/80 px-3 py-2 ring-1 ring-white/10">
      <span className="block text-[0.65rem] font-black text-white/45">{label}</span>
      <strong className="mt-1 block truncate text-xs font-black text-white">{value}</strong>
    </div>
  );
}
