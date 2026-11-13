import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Square, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/assistant")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({ meta: [{ title: "Assistant · FraudShield AI" }, { name: "description", content: "AI fraud investigation assistant." }, { property: "og:title", content: "Assistant · FraudShield AI" }, { property: "og:description", content: "AI fraud investigation assistant." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Assistant,
});

const examples = [
  "Show the top 10 suspicious transactions",
  "What are the most common fraud patterns?",
  "Summarize today's fraud activity",
  "Identify unusual transaction behavior",
  "Explain the risk score of transaction TXN1027",
];

function Assistant() {
  const { q } = Route.useSearch();
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [],
  );
  const { messages, sendMessage, status, stop, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (q && !sentInitial.current) { sentInitial.current = true; sendMessage({ text: q }); }
  }, [q, sendMessage]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => { if (!text.trim() || busy) return; sendMessage({ text }); setInput(""); };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4 lg:h-[calc(100vh-4rem)]">
      <header>
        <h1 className="text-3xl font-bold">FraudShield <span className="text-brand">Assistant</span></h1>
        <p className="text-sm text-muted-foreground">Ask questions about transactions, risk scores and fraud patterns.</p>
      </header>

      <div className="glass flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {examples.map((e) => (
              <button key={e} onClick={() => send(e)} className="rounded-lg border border-border bg-secondary/50 p-3 text-left text-sm hover:bg-accent">{e}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role !== "user" && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand"><Bot className="size-4 text-primary-foreground" /></span>}
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {m.parts.map((p, i) =>
                p.type === "text" ? <span key={i}>{p.text}</span> :
                p.type === "reasoning" && p.text ? <div key={i} className="mb-2 border-l-2 border-violet/50 pl-2 text-xs italic text-muted-foreground">{p.text}</div> : null,
              )}
            </div>
            {m.role === "user" && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary"><User className="size-4" /></span>}
          </div>
        ))}
        {status === "submitted" && <div className="text-sm text-muted-foreground">Analysing transactions…</div>}
        {error && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error.message || "The assistant couldn't respond."}</div>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass flex gap-2 p-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Why was TXN1027 marked as fraudulent?"
          className="min-h-11 resize-none border-0 bg-transparent"
          rows={1}
        />
        {busy ? (
          <Button type="button" variant="secondary" onClick={stop}><Square className="size-4" /></Button>
        ) : (
          <Button type="submit" className="bg-brand"><Send className="size-4" /></Button>
        )}
      </form>
    </div>
  );
}
