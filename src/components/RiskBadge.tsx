import { cn } from "@/lib/utils";
import { classifyRisk, type RiskThresholds } from "@/lib/risk";

export function RiskBadge({ score, t }: { score: number; t?: RiskThresholds | undefined }) {
  const level = classifyRisk(score, t);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        level === "High" && "bg-destructive/15 text-destructive",
        level === "Medium" && "bg-warning/15 text-warning",
        level === "Low" && "bg-success/15 text-success",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {level} Risk
    </span>
  );
}

export function StatusBadge({ fraud }: { fraud: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        fraud ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success",
      )}
    >
      {fraud ? "Fraudulent" : "Legitimate"}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const demo = source === "rule-model-demo";
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        demo ? "border-warning/40 text-warning" : "border-primary/40 text-primary",
      )}
      title={demo ? "Scored by the built-in rule model (demo mode), not a trained ML model" : "Scored by the ML service"}
    >
      {demo ? "Sample · rule model" : source}
    </span>
  );
}
