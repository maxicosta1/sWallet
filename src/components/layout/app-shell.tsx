"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  Menu,
  Monitor,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  Target,
  UserRoundCog,
  Users
} from "lucide-react";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { LogoutButton } from "@/components/layout/logout-button";
import { appModules, moduleGroups, modulesByGroup } from "@/config/modules";
import type { AppModule } from "@/config/modules";
import { canAccessModule } from "@/lib/permissions";

const moduleIcons = {
  dashboard: LayoutDashboard,
  agenda: CalendarDays,
  alerts: Bell,
  clients: Users,
  crm: Handshake,
  budgets: FileText,
  "client-portal": Monitor,
  projects: FolderKanban,
  tasks: ListTodo,
  documents: FileStack,
  support: BriefcaseBusiness,
  finance: WalletIcon,
  billing: ReceiptText,
  payments: CreditCard,
  movements: ReceiptText,
  subscriptions: Repeat,
  reports: BarChart3,
  team: UserRoundCog,
  goals: Target,
  marketing: Megaphone,
  admin: ClipboardList,
  settings: Settings
};

export function AppShell({ children, session }: { children: React.ReactNode; session: Session }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUiStore();
  const displayName = session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "equipo";
  const initials = displayName.slice(0, 2).toUpperCase();
  const allowedModules = appModules.filter((module) => canAccessModule(session.user.role, module.access));
  const mobileModules = ["dashboard", "clients", "projects", "reports", "alerts"]
    .map((key) => allowedModules.find((module) => module.key === key))
    .filter((module): module is AppModule => Boolean(module));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[292px] flex-col border-r border-white/10 bg-[#050706]/92 p-4 backdrop-blur-2xl transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="app-frame mb-4 flex items-center gap-3 rounded-[1.35rem] p-3">
          <div className="grid h-12 w-12 place-items-center rounded-[1.1rem] bg-primary text-xl font-black text-primary-foreground shadow-glow">
            s
          </div>
          <div>
            <strong className="block text-white">sWallet</strong>
            <span className="text-xs font-bold text-muted-foreground">Virtual Bank OS</span>
          </div>
        </div>

        <div className="virtual-card-surface mb-4 rounded-[1.35rem] p-4">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase text-black/60">Cuenta operativa</p>
            <strong className="mt-5 block text-2xl font-black text-black">sCode Wallet</strong>
            <p className="mt-2 text-xs font-bold text-black/65">**** **** 5087</p>
          </div>
        </div>

        <nav className="scrollbar-thin -mx-1 grid flex-1 content-start gap-5 overflow-y-auto pr-1">
          {moduleGroups.map((group) => {
            const items = modulesByGroup(group.key).filter((module) => allowedModules.some((allowed) => allowed.key === module.key));
            if (!items.length) return null;

            return (
              <section key={group.key} className="grid gap-2">
                <p className="px-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </p>
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = moduleIcons[item.key as keyof typeof moduleIcons] ?? LayoutDashboard;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSidebar}
                      className={cn(
                        "group flex items-center gap-3 rounded-[1.1rem] px-3 py-2.5 text-sm font-black text-muted-foreground transition hover:bg-white/[0.06] hover:text-white",
                        active && "bg-primary text-primary-foreground shadow-glow"
                      )}
                    >
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06]", active && "bg-black/12")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.status !== "active" ? (
                        <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[0.62rem] font-black uppercase text-muted-foreground">
                          {item.status === "foundation" ? "base" : "plan"}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </section>
            );
          })}
        </nav>

        <div className="app-frame mt-auto rounded-[1.35rem] p-4">
          <p className="text-xs font-black uppercase text-primary">Sesion</p>
          <p className="mt-2 truncate text-sm font-bold text-white">{session.user.email}</p>
          <p className="mb-3 mt-1 text-xs capitalize text-muted-foreground">{session.user.role.replaceAll("_", " ")}</p>
          <LogoutButton />
        </div>
      </aside>

      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={closeSidebar} aria-label="Cerrar menu" /> : null}

      <main className="min-w-0 px-4 pb-28 pt-4 md:px-7 md:py-5 lg:px-8">
        <header className="mb-6 hidden items-center justify-between gap-4 md:flex">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-black uppercase text-primary">sCode Digital Solutions</p>
              <h1 className="text-2xl font-black tracking-normal text-white md:text-4xl">sWallet banking</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <form action="/reports" className="app-frame flex h-12 items-center gap-2 rounded-2xl px-4 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                name="q"
                className="w-72 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-muted-foreground"
                placeholder="Buscar cliente, proyecto, factura o pago"
              />
            </form>
            <Button asChild variant="ghost" size="icon">
              <Link href="/alerts" aria-label="Alertas">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </header>
        <header className="mb-5 md:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-16 rounded-full border-white/10 bg-black/40 shadow-glass"
              onClick={toggleSidebar}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-12 w-16 rounded-full border-white/10 bg-black/40 shadow-glass"
                aria-label="Buscar"
              >
                <Link href="/reports">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>
              <div className="grid h-12 w-12 place-items-center rounded-full border border-primary/25 bg-primary text-sm font-black text-primary-foreground shadow-glow">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="h-full w-full rounded-full object-cover" />
                ) : initials ? (
                  initials
                ) : (
                  <CircleUserRound className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-7">
            <p className="text-xs font-black uppercase text-primary">sCode Digital Solutions</p>
            <h1 className="mt-2 text-[clamp(2.35rem,12vw,3.45rem)] font-black leading-[0.92] tracking-normal text-white">
              Hola,
              <span className="block text-primary">{displayName}</span>
            </h1>
          </div>
        </header>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.div>
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-[1.5rem] border border-white/10 bg-black/78 p-2 shadow-glass backdrop-blur-2xl md:hidden">
        {mobileModules.map((item) => {
          if (!item) return null;
          const Icon = moduleIcons[item.key as keyof typeof moduleIcons] ?? LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "grid min-h-14 place-items-center gap-1 rounded-[1.1rem] px-2 py-2 text-[0.65rem] font-black text-muted-foreground",
                active && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function WalletIcon(props: React.ComponentProps<typeof ReceiptText>) {
  return <ReceiptText {...props} />;
}
