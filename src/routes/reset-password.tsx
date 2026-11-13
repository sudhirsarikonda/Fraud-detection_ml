import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password · FraudShield AI" }, { name: "description", content: "Choose a new password." }, { property: "og:title", content: "Reset password · FraudShield AI" }, { property: "og:description", content: "Choose a new password." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={save} className="glass w-full max-w-sm space-y-4 p-8">
        <h1 className="text-xl font-bold">Set a new password</h1>
        <div className="space-y-1.5"><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" className="w-full bg-brand">Update password</Button>
      </form>
    </div>
  );
}
