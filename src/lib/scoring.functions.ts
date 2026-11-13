import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ruleModelPredict, type TxnFeatures } from "./risk";

const input = z.object({
  account_id: z.string().trim().min(1).max(40),
  amount: z.number().positive().max(1e10),
  txn_type: z.string().trim().min(1).max(60),
  location: z.string().trim().min(1).max(100),
  device: z.string().trim().max(100).nullable().default(null),
  ip_address: z.string().trim().max(60).nullable().default(null),
  occurred_at: z.string().datetime(),
});

/** The explicitly selected built-in sample model needs no external service. */
export const getMlStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ configured: true, online: true, checked_at: new Date().toISOString() }));

export const predictTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only administrators can submit transactions.");

    const { data: history, error: historyError } = await supabase
      .from("transactions")
      .select("amount, location, device, occurred_at")
      .eq("account_id", data.account_id)
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (historyError) throw new Error("Account history could not be loaded. Please retry.");
    const h = history ?? [];
    const dayAgo = Date.now() - 864e5;
    const features: TxnFeatures = {
      ...data,
      account_avg_amount: h.length ? h.reduce((a, t) => a + Number(t.amount), 0) / h.length : 0,
      account_txn_count_24h: h.filter((t) => new Date(t.occurred_at).getTime() > dayAgo).length,
      account_known_locations: [...new Set(h.map((t) => t.location))],
      account_known_devices: [...new Set(h.map((t) => t.device).filter(Boolean) as string[])],
    };

    const prediction = ruleModelPredict(features);

    const txn_code = `TXN${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const { data: row, error } = await supabase
      .from("transactions")
      .insert({ ...data, ...prediction, txn_code, created_by: userId })
      .select()
      .single();
    if (error) throw new Error("The prediction could not be saved. Please check transaction history before retrying.");
    return { transaction: row, features };
  });
