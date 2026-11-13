import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { predictTransaction } from "@/lib/scoring.functions";
import { MlServiceStatus } from "@/components/MlServiceStatus";
import { inr, roleQuery, thresholdsQuery } from "@/lib/data";
import { RiskBadge, SourceBadge, StatusBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/predict")({
  head: () => ({ meta: [{ title: "New Prediction · FraudShield AI" }, { name: "description", content: "Score a transaction for fraud." }, { property: "og:title", content: "New Prediction · FraudShield AI" }, { property: "og:description", content: "Score a transaction for fraud." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Predict,
});

const types = ["Card Purchase", "Online Transfer", "ATM Withdrawal", "UPI Payment", "Wire Transfer", "Bill Payment"];

function Predict() {
  const predictFn = useServerFn(predictTransaction);
  const qc = useQueryClient();
  const { data: me } = useQuery(roleQuery);
  const { data: t } = useQuery(thresholdsQuery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Awaited<ReturnType<typeof predictTransaction>> | null>(null);
  const [form, setForm] = useState({
    account_id: "ACC0042", amount: "185000", txn_type: "Wire Transfer", location: "Lagos, NG",
    device: "Unknown Device", ip_address: "", occurred_at: new Date().toISOString().slice(0, 16),
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.account_id.trim() || !(amount > 0) || !form.location.trim()) { toast.error("Account, a positive amount and location are required."); return; }
    setBusy(true);
    setError(null);
    setRes(null);
    try {
      const r = await predictFn({ data: { ...form, amount, device: form.device || null, ip_address: form.ip_address || null, occurred_at: new Date(form.occurred_at).toISOString() } });
      setRes(r);
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      void qc.invalidateQueries({ queryKey: ["ml_status"] });
      toast.success("Prediction saved to transaction history");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prediction failed. Please retry.";
      setError(message);
      toast.error(message);
      void qc.invalidateQueries({ queryKey: ["ml_status"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Submit a Transaction</h1>
        <p className="text-sm text-muted-foreground">Sample predictions · not trained ML results</p>
      </header>

      <MlServiceStatus />

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="glass grid gap-4 p-6 sm:grid-cols-2 lg:col-span-3">
          <Field label="Account ID"><Input value={form.account_id} onChange={set("account_id")} maxLength={40} /></Field>
          <Field label="Amount (₹)"><Input type="number" min="1" step="0.01" value={form.amount} onChange={set("amount")} /></Field>
          <Field label="Type">
            <select value={form.txn_type} onChange={set("txn_type")} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              {types.map((x) => <option key={x} className="bg-popover">{x}</option>)}
            </select>
          </Field>
          <Field label="Location"><Input value={form.location} onChange={set("location")} maxLength={100} /></Field>
          <Field label="Device (optional)"><Input value={form.device} onChange={set("device")} maxLength={100} /></Field>
          <Field label="IP address (optional)"><Input value={form.ip_address} onChange={set("ip_address")} maxLength={60} /></Field>
          <Field label="Date & time"><Input type="datetime-local" value={form.occurred_at} onChange={set("occurred_at")} /></Field>
          <div className="flex items-end">
            <Button type="submit" disabled={busy || me?.role !== "admin"} className="w-full bg-brand shadow-glow">
              {busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? "Analysing…" : me?.role !== "admin" ? "Admins only" : "Run fraud prediction"}
            </Button>
          </div>
        </form>

        <div className="glass p-6 lg:col-span-2" aria-live="polite" aria-busy={busy}>
          {busy ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Analysing transaction…</div> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !res ? (
            <p className="text-sm text-muted-foreground">The prediction result will appear here.</p>
          ) : (
            <div className="animate-rise space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{res.transaction.txn_code}</span>
                <SourceBadge source={res.transaction.model_source} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Fraud probability" value={`${Number(res.transaction.fraud_probability).toFixed(1)}%`} />
                <Stat label="Risk score" value={`${Number(res.transaction.risk_score).toFixed(0)} / 100`} />
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge fraud={res.transaction.is_fraud} />
                <RiskBadge score={Number(res.transaction.risk_score)} t={t} />
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{res.transaction.is_anomaly ? "Anomaly detected" : "No anomaly"}</span>
              </div>
              <div className="text-xs text-muted-foreground">Account avg: {inr(res.features.account_avg_amount)} · {res.features.account_txn_count_24h} txns / 24h</div>
              <div className="text-xs text-muted-foreground">Saved: {new Date(res.transaction.created_at).toLocaleString()}</div>
              <ul className="list-inside list-disc text-sm">{(res.transaction.factors as string[]).map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-secondary p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-display text-2xl font-bold">{value}</div></div>;
}
