import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./run-id.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export async function handleChat(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u, error: ue } = await sb.auth.getUser(token);
  if (ue || !u.user) return new Response("Unauthorized", { status: 401 });

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("AI is not configured", { status: 500 });

  const { messages } = (await request.json()) as { messages: UIMessage[] };
  if (!Array.isArray(messages) || messages.length > 60) return new Response("Bad request", { status: 400 });

  const [{ data: txns }, { data: th }] = await Promise.all([
    sb.from("transactions").select("txn_code,account_id,amount,txn_type,location,device,occurred_at,fraud_probability,risk_score,is_fraud,is_anomaly,model_source,factors").order("occurred_at", { ascending: false }).limit(1000),
    sb.from("risk_settings").select("low_max,medium_max").eq("id", 1).maybeSingle(),
  ]);
  const rows = txns ?? [];
  const csv = rows
    .map((t) => [t.txn_code, t.account_id, t.amount, t.txn_type, t.location, t.device ?? "", t.occurred_at.slice(0, 16), t.fraud_probability, t.risk_score, t.is_fraud ? 1 : 0, t.is_anomaly ? 1 : 0, t.model_source, (t.factors as string[]).join("; ")].join("|"))
    .join("\n");

  const instructions = `You are FraudShield Assistant, an expert fraud investigator helping administrators.
Answer ONLY from the transaction data below; never invent transactions. Be concise, use markdown lists/tables.
Risk levels: Low 0–${th?.low_max ?? 30}, Medium ${(th?.low_max ?? 30) + 1}–${th?.medium_max ?? 70}, High above.
Rows with model_source "rule-model-demo" were scored by a built-in rule model (demo mode), not a trained ML model — say so when explaining their scores.
Today is ${new Date().toISOString().slice(0, 10)} (UTC). Amounts are INR.
Columns: txn_code|account|amount|type|location|device|time_utc|fraud_prob|risk_score|is_fraud|is_anomaly|model_source|factors
${csv}`;

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return withLovableAiGatewayRunIdHeader(result.toUIMessageStreamResponse({ sendReasoning: true }), runIdFetch);
}
