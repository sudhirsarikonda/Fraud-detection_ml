import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { inr, thresholdsQuery, transactionsQuery, type Txn } from "@/lib/data";
import { classifyRisk } from "@/lib/risk";
import { RiskBadge, SourceBadge, StatusBadge } from "@/components/RiskBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions · FraudShield AI" }, { name: "description", content: "Monitor and investigate transactions." }, { property: "og:title", content: "Transactions · FraudShield AI" }, { property: "og:description", content: "Monitor and investigate transactions." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(transactionsQuery), context.queryClient.ensureQueryData(thresholdsQuery)]),
  component: Transactions,
});

const filters = ["All", "Fraudulent", "Legitimate", "High", "Medium", "Low"] as const;
const PAGE = 15;

function Transactions() {
  const { data: txns } = useSuspenseQuery(transactionsQuery);
  const { data: t } = useSuspenseQuery(thresholdsQuery);
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Txn | null>(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return txns.filter((x) => {
      if (s && ![x.txn_code, x.account_id, x.location, x.txn_type].some((v) => v.toLowerCase().includes(s))) return false;
      if (f === "Fraudulent") return x.is_fraud;
      if (f === "Legitimate") return !x.is_fraud;
      if (f === "All") return true;
      return classifyRisk(Number(x.risk_score), t) === f;
    });
  }, [txns, q, f, t]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Transaction Monitoring</h1>
          <p className="text-sm text-muted-foreground">{rows.length} matching transactions</p>
        </div>
        <Button asChild><Link to="/predict">+ Submit transaction</Link></Button>
      </header>

      <div className="glass flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search ID, account, location, type…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((x) => (
            <button
              key={x}
              onClick={() => { setF(x); setPage(0); }}
              className={cn("rounded-full px-3 py-1 text-xs transition-colors", f === x ? "bg-brand text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent")}
            >
              {["High", "Medium", "Low"].includes(x) ? `${x} Risk` : x}
            </button>
          ))}
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              {["Txn ID", "Account", "Amount", "Type", "Location", "Date & time", "Fraud prob.", "Risk", "Status"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((x) => (
              <tr key={x.id} onClick={() => setSel(x)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/40">
                <td className="px-4 py-3 font-mono">{x.txn_code}</td>
                <td className="px-4 py-3">{x.account_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{inr(Number(x.amount))}</td>
                <td className="px-4 py-3 whitespace-nowrap">{x.txn_type}</td>
                <td className="px-4 py-3 whitespace-nowrap">{x.location}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(x.occurred_at).toLocaleString()}</td>
                <td className="px-4 py-3">{Number(x.fraud_probability).toFixed(0)}%</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-6">{Number(x.risk_score).toFixed(0)}</span><RiskBadge score={Number(x.risk_score)} t={t} /></div></td>
                <td className="px-4 py-3"><StatusBadge fraud={x.is_fraud} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
        <Button variant="secondary" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-lg">
          {sel && (
            <>
              <DialogHeader><DialogTitle className="font-mono">{sel.txn_code}</DialogTitle></DialogHeader>
              <div className="flex flex-wrap gap-2"><StatusBadge fraud={sel.is_fraud} /><RiskBadge score={Number(sel.risk_score)} t={t} /><SourceBadge source={sel.model_source} />{sel.is_anomaly && <span className="rounded-md bg-violet/15 px-2 py-0.5 text-xs text-violet">Anomaly</span>}</div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[["Account", sel.account_id], ["Amount", inr(Number(sel.amount))], ["Type", sel.txn_type], ["Location", sel.location], ["Device", sel.device ?? "—"], ["IP", sel.ip_address ?? "—"], ["Time", new Date(sel.occurred_at).toLocaleString()], ["Fraud probability", `${Number(sel.fraud_probability).toFixed(1)}%`], ["Risk score", Number(sel.risk_score).toFixed(0)]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Contributing factors</div>
                <ul className="list-inside list-disc text-sm">{(sel.factors as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <Button asChild variant="secondary"><Link to="/assistant" search={{ q: `Explain the risk score of transaction ${sel.txn_code}` }}>Ask the assistant</Link></Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
