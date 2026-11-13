import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, Percent, IndianRupee, Flame } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { inr, thresholdsQuery, transactionsQuery } from "@/lib/data";
import { classifyRisk } from "@/lib/risk";
import { RiskBadge } from "@/components/RiskBadge";
import { MlServiceStatus } from "@/components/MlServiceStatus";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · FraudShield AI" }, { name: "description", content: "Fraud analytics overview." }, { property: "og:title", content: "Dashboard · FraudShield AI" }, { property: "og:description", content: "Fraud analytics overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(transactionsQuery), context.queryClient.ensureQueryData(thresholdsQuery)]),
  component: Dashboard,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)" } };

function Dashboard() {
  const { data: txns } = useSuspenseQuery(transactionsQuery);
  const { data: t } = useSuspenseQuery(thresholdsQuery);

  const s = useMemo(() => {
    const fraud = txns.filter((x) => x.is_fraud);
    const high = txns.filter((x) => classifyRisk(Number(x.risk_score), t) === "High");
    const byDay = new Map<string, { day: string; total: number; fraud: number; legit: number; avgRisk: number; n: number }>();
    for (const x of txns) {
      const d = x.occurred_at.slice(0, 10);
      const e = byDay.get(d) ?? { day: d.slice(5), total: 0, fraud: 0, legit: 0, avgRisk: 0, n: 0 };
      e.total++; e.n++; e.avgRisk += Number(x.risk_score);
      x.is_fraud ? e.fraud++ : e.legit++;
      byDay.set(d, e);
    }
    const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => ({ ...v, avgRisk: Math.round(v.avgRisk / v.n) }));
    const dist = (["Low", "Medium", "High"] as const).map((l) => ({ name: l, value: txns.filter((x) => classifyRisk(Number(x.risk_score), t) === l).length }));
    return {
      total: txns.length,
      fraud: fraud.length,
      legit: txns.length - fraud.length,
      rate: txns.length ? (fraud.length / txns.length) * 100 : 0,
      amount: fraud.reduce((a, x) => a + Number(x.amount), 0),
      high: high.length,
      days,
      dist,
      recent: txns.filter((x) => classifyRisk(Number(x.risk_score), t) !== "Low").slice(0, 8),
      alerts: fraud.slice(0, 6),
    };
  }, [txns, t]);

  const kpis = [
    { label: "Total Transactions", value: s.total.toLocaleString(), icon: Activity, tone: "text-primary" },
    { label: "Fraudulent", value: s.fraud.toLocaleString(), icon: AlertTriangle, tone: "text-destructive" },
    { label: "Legitimate", value: s.legit.toLocaleString(), icon: CheckCircle2, tone: "text-success" },
    { label: "Fraud Detection Rate", value: `${s.rate.toFixed(1)}%`, icon: Percent, tone: "text-violet" },
    { label: "Suspicious Amount", value: inr(s.amount), icon: IndianRupee, tone: "text-warning" },
    { label: "High-Risk", value: s.high.toLocaleString(), icon: Flame, tone: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Fraud Command Center</h1>
        <p className="text-sm text-muted-foreground">Live metrics calculated from {s.total} transactions in the database.</p>
      </header>
      <MlServiceStatus />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <div key={k.label} className="glass animate-rise p-4" style={{ animationDelay: `${i * 50}ms` }}>
            <k.icon className={`size-5 ${k.tone}`} />
            <div className="mt-3 font-display text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Transaction activity" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={s.days}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="total" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Fraud vs legitimate">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={[{ name: "Fraud", value: s.fraud }, { name: "Legitimate", value: s.legit }]} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={3}>
                <Cell fill="var(--destructive)" />
                <Cell fill="var(--success)" />
              </Pie>
              <Tooltip {...tip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Daily fraud detections">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.days}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip {...tip} />
              <Bar dataKey="fraud" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Fraud trend (avg risk score)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={s.days}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="avgRisk" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Risk distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.dist} layout="vertical">
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={60} />
              <Tooltip {...tip} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <Cell fill="var(--success)" />
                <Cell fill="var(--warning)" />
                <Cell fill="var(--destructive)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent suspicious transactions">
          <ul className="divide-y divide-border">
            {s.recent.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-mono font-medium">{x.txn_code}</div>
                  <div className="text-xs text-muted-foreground">{x.account_id} · {x.location}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right"><span>{inr(Number(x.amount))}</span><div className="text-xs text-muted-foreground">{Number(x.fraud_probability).toFixed(1)}% · {Number(x.risk_score).toFixed(0)} / 100</div></div>
                  <RiskBadge score={Number(x.risk_score)} t={t} />
                </div>
              </li>
            ))}
          </ul>
          <Link to="/transactions" className="mt-3 inline-block text-sm text-primary">View all →</Link>
        </Panel>
        <Panel title="Latest fraud alerts">
          <ul className="space-y-2">
            {s.alerts.map((x) => (
              <li key={x.id} className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono font-semibold text-destructive">{x.txn_code}</span>
                  <span className="text-xs text-muted-foreground">{new Date(x.occurred_at).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {inr(Number(x.amount))} · {x.txn_type} · {(x.factors as string[])[0]}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
