"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Search,
  Settings,
  Users
} from "lucide-react";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { LogoutButton } from "@/components/layout/logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/movements", label: "Movimientos", icon: ReceiptText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/subscriptions", label: "Suscripciones", icon: BriefcaseBusiness },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children, session }: { children: React.ReactNode; session: Session }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUiStore();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[300px] flex-col border-r border-white/10 bg-[#080913]/90 p-5 backdrop-blur-2xl transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-coral text-xl font-black text-white shadow-glow">
            s
          </div>
          <div>
            <strong className="block text-white">sCode</strong>
            <span className="text-xs font-semibold text-muted-foreground">Finance OS</span>
          </div>
        </div>

        <nav className="grid gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-primary/10 hover:text-white",
                  active && "bg-primary/15 text-white ring-1 ring-primary/30"
                )}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06]">
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase text-primary">Sesión</p>
          <p className="mt-2 truncate text-sm font-bold text-white">{session.user.email}</p>
          <p className="mb-3 mt-1 text-xs capitalize text-muted-foreground">{session.user.role.replaceAll("_", " ")}</p>
          <LogoutButton />
        </div>
      </aside>

      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={closeSidebar} aria-label="Cerrar menú" /> : null}

      <main className="min-w-0 px-4 py-5 md:px-7 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-black uppercase text-primary">sCode Digital Solutions</p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-4xl">Finance SaaS</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Buscar cliente, pago o proyecto
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
