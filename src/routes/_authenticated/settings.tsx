import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gauge, Cpu, UserCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { roleQuery, thresholdsQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MlServiceStatus } from "@/components/MlServiceStatus";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · FraudShield AI" }, { name: "description", content: "Configure risk thresholds, model and account settings." }, { property: "og:title", content: "Settings · FraudShield AI" }, { property: "og:description", content: "Configure risk thresholds, model and account settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(thresholdsQuery),
  component: SettingsPage,
});

function Section({ icon: Icon, title, desc, children }: { icon: typeof Gauge; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-4 p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary"><Icon className="size-4 text-brand" /></span>
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsPage() {
  const { data: t } = useSuspenseQuery(thresholdsQuery);
  const { data: me } = useQuery(roleQuery);
  const qc = useQueryClient();
  const [low, setLow] = useState(String(t.low_max));
  const [med, setMed] = useState(String(t.medium_max));
  const [email, setEmail] = useState<string | null>(null);
  const isAdmin = me?.role === "admin";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function save(): Promise<void> {
    const l = Number(low), m = Number(med);
    if (!Number.isInteger(l) || !Number.isInteger(m) || l < 1 || m <= l || m >= 100) { toast.error("Use whole numbers with 0 < Low max < Medium max < 100."); return; }
    const { error } = await supabase.from("risk_settings").update({ low_max: l, medium_max: m, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["risk_settings"] });
    toast.success("Thresholds saved");
  }

  async function resetPassword(): Promise<void> {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Password reset email sent");
  }

  const l = Number(low), m = Number(med);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage risk levels, the scoring model and your account.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={Gauge} title="Risk thresholds" desc="Decide which risk scores count as Low, Medium or High.">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Low risk up to</Label><Input type="number" value={low} onChange={(e) => setLow(e.target.value)} disabled={!isAdmin} /></div>
            <div className="space-y-1.5"><Label>Medium risk up to</Label><Input type="number" value={med} onChange={(e) => setMed(e.target.value)} disabled={!isAdmin} /></div>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full">
            <div className="bg-success" style={{ width: `${Math.max(0, Math.min(100, l))}%` }} />
            <div className="bg-warning" style={{ width: `${Math.max(0, Math.min(100, m - l))}%` }} />
            <div className="flex-1 bg-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Low: 0–{low} · Medium: {l + 1}–{med} · High: {m + 1}–100</p>
          <div className="flex gap-2">
            <Button onClick={save} disabled={!isAdmin}>{isAdmin ? "Save" : "Admins only"}</Button>
            {isAdmin && <Button variant="secondary" onClick={() => { setLow("30"); setMed("70"); }}>Reset to 30 / 70</Button>}
          </div>
        </Section>

        <Section icon={Cpu} title="Scoring model" desc="The built-in sample model scores every new transaction.">
          <MlServiceStatus />
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Results are labelled as sample/demo, not trained ML output.</li>
            <li>• Fraud probability is shown as a percentage; risk score on 0–100.</li>
            <li>• Every prediction is saved to transaction history with its factors.</li>
          </ul>
        </Section>

        <Section icon={UserCircle} title="Account" desc="Your sign-in details.">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Email</dt><dd className="truncate">{email ?? "…"}</dd>
            <dt className="text-muted-foreground">Role</dt><dd className="capitalize">{me?.role ?? "…"}</dd>
          </dl>
          <Button variant="secondary" onClick={resetPassword} disabled={!email}>Send password reset email</Button>
        </Section>

        <Section icon={ShieldCheck} title="Access & permissions" desc="What each role can do.">
          <ul className="space-y-2 text-sm">
            <li><span className="font-medium">Admin</span> <span className="text-muted-foreground">— change thresholds, view all data, use the assistant.</span></li>
            <li><span className="font-medium">Analyst</span> <span className="text-muted-foreground">— view transactions, run predictions, use the assistant.</span></li>
          </ul>
          <p className="text-xs text-muted-foreground">The first account created is the admin; later sign-ups become analysts.</p>
        </Section>
      </div>
    </div>
  );
}
