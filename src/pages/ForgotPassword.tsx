import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="text-primary" size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <p className="text-center text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, you'll receive a password reset email shortly.
          </p>
        )}

        <div className="mt-6 text-center">
          <Link to="/admin/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
        </div>
      </div>
    </PageShell>
  );
};

export default ForgotPassword;
