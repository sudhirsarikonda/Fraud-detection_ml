import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · FraudShield AI" },
      { name: "description", content: "Sign in to the FraudShield AI fraud monitoring console." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Sign in · FraudShield AI" },
      { property: "og:description", content: "Secure access to fraud monitoring and investigations." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
  }, [navigate]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrors({});
    if (mode === "forgot") {
      const r = z.string().email().safeParse(email.trim());
      if (!r.success) { setErrors({ email: "Enter a valid email" }); return; }
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      { error ? toast.error(error.message) : toast.success("Check your inbox for a reset link."); return; }
    }
    const r = schema.safeParse({ email, password });
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ ...r.data, options: { emailRedirectTo: window.location.origin + "/dashboard" } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword(r.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (remember) localStorage.removeItem("fs_session_only");
    else { localStorage.setItem("fs_session_only", "1"); sessionStorage.setItem("fs_alive", "1"); }
    navigate({ to: "/dashboard" });
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    else if (!res.redirected) navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="glass w-full max-w-md animate-rise p-8 shadow-glow">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand"><ShieldCheck className="size-6 text-primary-foreground" /></span>
          <div>
            <h1 className="text-xl font-bold">FraudShield <span className="text-brand">AI</span></h1>
            <p className="text-xs text-muted-foreground">
              {mode === "signin" ? "Sign in to the monitoring console" : mode === "signup" ? "Create an account" : "Reset your password"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-2.5 text-muted-foreground">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors["password"] && <p className="text-xs text-destructive">{errors["password"]}</p>}
            </div>
          )}
          {mode === "signin" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2"><Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} /> Remember me</label>
              <button type="button" onClick={() => setMode("forgot")} className="text-primary">Forgot password?</button>
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full bg-brand shadow-glow">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </Button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <button type="button" onClick={google} className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#8E918F] bg-[#131314] text-sm font-medium text-[#E3E3E3]">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
              Continue with Google
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>No account? <button onClick={() => setMode("signup")} className="text-primary">Create one</button></>
          ) : (
            <button onClick={() => setMode("signin")} className="text-primary">Back to sign in</button>
          )}
        </p>
      </div>
    </div>
  );
}
