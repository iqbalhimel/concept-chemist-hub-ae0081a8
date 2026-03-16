import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

const AuthCallback = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash/query
    // and fires an auth state change. We listen for SIGNED_IN or PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        // User session established from invite token — show password form
        setStatus("ready");
      }
    });

    // Also check if a session already exists (token may have been auto-exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if this looks like a fresh invite (user has no password set yet)
        // We show the password form regardless — setting a password is idempotent
        setStatus("ready");
      } else {
        // Give Supabase a moment to process the hash tokens
        const timeout = setTimeout(() => {
          setStatus((prev) => (prev === "loading" ? "error" : prev));
        }, 5000);
        return () => clearTimeout(timeout);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account activated! Redirecting to dashboard…");
    navigate("/admin", { replace: true });
  };

  if (status === "loading") {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-card w-full max-w-md p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Processing invitation…</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (status === "error") {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-card w-full max-w-md p-8 text-center space-y-4">
            <p className="text-muted-foreground">
              Invalid or expired invitation link. Please ask your admin to send a new invite.
            </p>
            <Button onClick={() => navigate("/admin/login")}>Go to Login</Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-primary" size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Set Your Password</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a password to activate your admin account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Activating…" : "Activate Account"}
            </Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default AuthCallback;
