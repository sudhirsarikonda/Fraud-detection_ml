import { afterEach, describe, expect, it, vi } from "vitest";
import { ruleModelPredict, type TxnFeatures } from "./risk";

const typical: TxnFeatures = {
  account_id: "SAMPLE", amount: 250, txn_type: "Card Purchase", location: "Kolkata",
  device: "Known Phone", occurred_at: "2026-11-09T12:00:00Z",
  account_avg_amount: 250, account_txn_count_24h: 1,
  account_known_locations: ["Kolkata"], account_known_devices: ["Known Phone"],
};
afterEach(() => vi.unstubAllGlobals());

describe("explicit sample scoring", () => {
  it("works without any external API or key, including when network access fails", () => {
    const fetcher = vi.fn(() => { throw new Error("Offline"); });
    vi.stubGlobal("fetch", fetcher);
    expect(ruleModelPredict(typical)).toEqual({ fraud_probability: 5, risk_score: 5,
      is_fraud: false, is_anomaly: false, factors: ["Typical pattern for this account"], model_source: "rule-model-demo" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses transaction details and history to produce repeatable sample results", () => {
    const unusual = { ...typical, amount: 185000, txn_type: "Wire Transfer", location: "Lagos", device: "Unknown Device", account_txn_count_24h: 8, occurred_at: "2026-11-09T02:00:00Z" };
    const result = ruleModelPredict(unusual);
    expect(result.risk_score).toBe(99);
    expect(result.fraud_probability).toBe(99);
    expect(result.is_fraud).toBe(true);
    expect(result.is_anomaly).toBe(true);
    expect(result.factors).toContain("New location for this account");
    expect(ruleModelPredict(unusual)).toEqual(result);
  });
});