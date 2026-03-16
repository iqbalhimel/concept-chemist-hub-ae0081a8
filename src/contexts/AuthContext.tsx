import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "@/lib/securityLogger";
import type { AdminRole } from "@/lib/permissions";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    // Check if user has any admin role
    const { data: anyAdmin } = await supabase.rpc("is_any_admin", { _user_id: userId });
    setIsAdmin(!!anyAdmin);

    if (anyAdmin) {
      // Get the specific role
      const { data: role } = await supabase.rpc("get_admin_role", { _user_id: userId });
      setAdminRole((role as AdminRole) || "admin");

      // Update last_login_at in profiles
      await supabase
        .from("profiles")
        .upsert({ user_id: userId, last_login_at: new Date().toISOString() } as any, { onConflict: "user_id" })
        .select()
        .single();

      // Record login history with IP and device detection (fire-and-forget)
      const deviceInfo = `${navigator.userAgent}`;
      supabase.functions
        .invoke("record-login", { body: { device_info: deviceInfo, success: true } })
        .catch((err) => console.warn("[AuthContext] Failed to record login:", err));
    } else {
      setAdminRole(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkAdmin(session.user.id), 0);
        } else {
          setIsAdmin(false);
          setAdminRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    logSecurityEvent({
      event_type: "logout",
      description: `Admin logged out: ${user?.email}`,
      user_email: user?.email || undefined,
      user_id: user?.id || undefined,
    });
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, adminRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
