import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Cpu, Bot, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FraudShield AI – Smart Financial Fraud Detection" },
      { name: "description", content: "Detect suspicious transactions, score fraud risk and investigate with an AI assistant." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "FraudShield AI – Smart Financial Fraud Detection" },
      { property: "og:description", content: "Sample fraud scoring, transaction analytics and AI-assisted investigations." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <nav className="flex items-center justify-between py-6">
        <span className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl bg-brand"><ShieldCheck className="size-5 text-primary-foreground" /></span>
          FraudShield <span className="text-brand">AI</span>
        </span>
        <Button asChild variant="secondary"><Link to="/auth">Sign in</Link></Button>
      </nav>
      <section className="flex flex-1 flex-col items-center justify-center py-16 text-center animate-rise">
        <span className="mb-5 rounded-full border border-primary/30 px-3 py-1 text-xs text-primary">Financial fraud intelligence</span>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
          Stop fraud <span className="text-brand">before it settles.</span>
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Score every transaction, surface anomalies, and let an AI investigator explain exactly why something was flagged.</p>
        <Button asChild size="lg" className="mt-8 bg-brand shadow-glow"><Link to="/dashboard">Open the console</Link></Button>
        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {[
            { icon: Cpu, t: "Sample risk scoring", d: "Demonstration scores · not trained ML predictions." },
            { icon: Activity, t: "Live analytics", d: "KPIs and trends computed from your transaction data." },
            { icon: Bot, t: "AI investigator", d: "Ask why a transaction was flagged, in plain language." },
          ].map((f) => (
            <div key={f.t} className="glass p-5 text-left">
              <f.icon className="size-5 text-primary" />
              <div className="mt-3 font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
