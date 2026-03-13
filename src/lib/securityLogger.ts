import { supabase } from "@/integrations/supabase/client";

interface SecurityEvent {
  event_type: string;
  description?: string;
  user_email?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs a security event via the edge function (captures IP server-side).
 * Fire-and-forget — never blocks the UI.
 */
export const logSecurityEvent = (event: SecurityEvent) => {
  try {
    supabase.functions
      .invoke("log-security-event", { body: event })
      .catch((err) => console.warn("[SecurityLog] Failed to log event:", err));
  } catch {
    // Silently fail — logging should never break the app
  }
};
