import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_THRESHOLDS, type RiskThresholds } from "./risk";
import type { Tables } from "@/integrations/supabase/types";

export type Txn = Tables<"transactions">;

export const transactionsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: async (): Promise<Txn[]> => {
    const all: Txn[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .range(from, from + 999);
      if (error) throw error;
      all.push(...data);
      if (data.length < 1000) break;
    }
    return all;
  },
});

export const thresholdsQuery = queryOptions({
  queryKey: ["risk_settings"],
  queryFn: async (): Promise<RiskThresholds> => {
    const { data } = await supabase.from("risk_settings").select("low_max, medium_max").eq("id", 1).maybeSingle();
    return data ?? DEFAULT_THRESHOLDS;
  },
});

export const roleQuery = queryOptions({
  queryKey: ["my_role"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { email: "", role: null as string | null };
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const roles = (data ?? []).map((r) => r.role);
    return { email: u.user.email ?? "", role: roles.includes("admin") ? "admin" : roles[0] ?? null };
  },
});

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
