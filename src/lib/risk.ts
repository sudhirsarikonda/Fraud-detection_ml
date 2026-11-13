export type RiskLevel = "Low" | "Medium" | "High";
export interface RiskThresholds {
  low_max: number;
  medium_max: number;
}
export const DEFAULT_THRESHOLDS: RiskThresholds = { low_max: 30, medium_max: 70 };

export function classifyRisk(score: number, t: RiskThresholds = DEFAULT_THRESHOLDS): RiskLevel {
  if (score <= t.low_max) return "Low";
  if (score <= t.medium_max) return "Medium";
  return "High";
}

export interface TxnFeatures {
  account_id: string;
  amount: number;
  txn_type: string;
  location: string;
  device?: string | null;
  ip_address?: string | null;
  occurred_at: string;
  // Derived from account history
  account_avg_amount: number;
  account_txn_count_24h: number;
  account_known_locations: string[];
  account_known_devices: string[];
}

export interface Prediction {
  fraud_probability: number;
  risk_score: number;
  is_fraud: boolean;
  is_anomaly: boolean;
  factors: string[];
  model_source: string;
}

/**
 * Explicitly selected, deterministic sample scoring model; never an API fallback.
 * It is NOT Random Forest / XGBoost / Isolation Forest — results are labelled "rule-model-demo".
 */
export function ruleModelPredict(f: TxnFeatures): Prediction {
  let s = 5;
  const factors: string[] = [];
  const avg = f.account_avg_amount || 0;
  if (avg > 0 && f.amount > avg * 5) { s += 35; factors.push(`Amount is ${(f.amount / avg).toFixed(1)}× the account average`); }
  else if (avg > 0 && f.amount > avg * 2) { s += 18; factors.push("Amount well above account average"); }
  if (f.amount >= 100000) { s += 15; factors.push("Very large transaction amount"); }
  if (f.account_txn_count_24h >= 8) { s += 15; factors.push(`${f.account_txn_count_24h} transactions in the last 24h`); }
  if (f.account_known_locations.length && !f.account_known_locations.includes(f.location)) { s += 15; factors.push("New location for this account"); }
  if (f.device && f.account_known_devices.length && !f.account_known_devices.includes(f.device)) { s += 10; factors.push("New device for this account"); }
  if (f.device && /unknown/i.test(f.device)) { s += 8; factors.push("Unrecognised device"); }
  const hour = new Date(f.occurred_at).getUTCHours();
  if (hour >= 0 && hour < 5) { s += 10; factors.push("Late-night activity (00:00–05:00 UTC)"); }
  if (/wire|transfer/i.test(f.txn_type)) { s += 5; factors.push("High-risk transaction channel"); }
  const risk = Math.max(1, Math.min(99, Math.round(s)));
  if (!factors.length) factors.push("Typical pattern for this account");
  return {
    risk_score: risk,
    fraud_probability: risk,
    is_fraud: risk > 70,
    is_anomaly: risk > 80,
    factors,
    model_source: "rule-model-demo",
  };
}
