import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/loginRateLimiter";
import { logSecurityEvent } from "@/lib/securityLogger";

const CAPTCHA_THRESHOLD = 3;

function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const { signIn, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const showCaptcha = failCount >= CAPTCHA_THRESHOLD;

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  }, []);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  // Re-check rate limit on mount & periodically
  useEffect(() => {
    const check = () => {
      const result = checkRateLimit();
      setRateLimitMsg(result.allowed ? null : result.message || null);
      if (result.attemptCount !== undefined) setFailCount(result.attemptCount);
    };
    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    // Check rate limit
    const limitCheck = checkRateLimit();
    if (!limitCheck.allowed) {
      setRateLimitMsg(limitCheck.message || "Too many attempts.");
      toast.error(limitCheck.message || "Too many login attempts.");
      return;
    }

    // Validate CAPTCHA if shown
    if (showCaptcha) {
      const parsed = parseInt(captchaInput, 10);
      if (isNaN(parsed) || parsed !== captcha.answer) {
        toast.error("Incorrect CAPTCHA answer. Please try again.");
        refreshCaptcha();
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        recordFailedAttempt();
        logSecurityEvent({
          event_type: "login_failed",
          description: `Failed login attempt for ${email.trim()}`,
          user_email: email.trim(),
          metadata: { error: error.message },
        });
        const recheck = checkRateLimit();
        const newCount = recheck.attemptCount ?? failCount + 1;
        setFailCount(newCount);
        if (!recheck.allowed) {
          setRateLimitMsg(recheck.message || null);
          toast.error(recheck.message || "Too many login attempts.");
        } else {
          toast.error("Login failed: " + error.message);
        }
        refreshCaptcha();
        setSubmitting(false);
        return;
      }
      // Success — reset everything
      resetRateLimit();
      setRateLimitMsg(null);
      setFailCount(0);
      logSecurityEvent({
        event_type: "login_success",
        description: `Successful login for ${email.trim()}`,
        user_email: email.trim(),
      });
      // Don't navigate here — let the useEffect handle it when isAdmin becomes true
      setSubmitting(false);
    } catch (err) {
      console.error("[AdminLogin] Unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-primary" size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to manage your website</p>
        </div>

        {rateLimitMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-2">
            <ShieldAlert className="shrink-0" size={20} />
            <span>{rateLimitMsg}</span>
          </div>
        )}

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
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>

          {showCaptcha && !rateLimitMsg && (
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="captcha" className="text-sm font-medium text-foreground">
                  Security Check
                </Label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="New question"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Solve to continue: <span className="font-mono font-bold text-foreground">{captcha.question}</span>
              </p>
              <Input
                id="captcha"
                type="text"
                inputMode="numeric"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Your answer"
                required
                className="mt-1"
                autoComplete="off"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting || !!rateLimitMsg}>
            {submitting ? "Signing in..." : rateLimitMsg ? "Temporarily Blocked" : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
