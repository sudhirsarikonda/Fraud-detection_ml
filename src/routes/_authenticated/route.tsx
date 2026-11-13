import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ListChecks, ScanSearch, Bot, Settings, LogOut, ShieldCheck, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { roleQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ListChecks },
  { to: "/predict", label: "New Prediction", icon: ScanSearch },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Shell() {
  const { data: me } = useQuery(roleQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-4">
      <Link to="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="grid size-9 place-items-center rounded-xl bg-brand shadow-glow">
          <ShieldCheck className="size-5 text-primary-foreground" />
        </span>
        <span className="font-display text-lg font-bold">
          FraudShield <span className="text-brand">AI</span>
        </span>
      </Link>
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
        >
          <n.icon className="size-4" />
          {n.label}
        </Link>
      ))}
      <div className="mt-auto rounded-xl border border-sidebar-border p-3 text-xs">
        <div className="truncate font-medium">{me?.email}</div>
        <div className="mt-0.5 text-muted-foreground capitalize">{me?.role ?? "no role"}</div>
        <button onClick={signOut} className="mt-3 flex items-center gap-2 text-muted-foreground hover:text-destructive">
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-64 border-r border-sidebar-border bg-sidebar" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-border p-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <span className="font-display font-bold">FraudShield AI</span>
        </div>
        <div className={cn("mx-auto max-w-7xl p-4 md:p-8")}>
          {me && !me.role ? (
            <div className="glass p-8 text-center text-muted-foreground">Your account has no role yet. Ask an administrator for access.</div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
