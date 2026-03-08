import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      toast.error("Login failed: " + error.message);
      setSubmitting(false);
      return;
    }
    // Wait a moment for auth state to propagate, then check admin
    setTimeout(() => {
      navigate("/admin", { replace: true });
      setSubmitting(false);
    }, 500);
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
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
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
