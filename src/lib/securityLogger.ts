import { supabase } from "@/integrations/supabase/client";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

interface SecurityEvent {
  event_type: string;
  description?: string;
  user_email?: string;
  user_id?: string;
  severity?: SecuritySeverity;
  metadata?: Record<string, unknown>;
}

const inferSeverity = (event: SecurityEvent): SecuritySeverity => {
  if (event.severity) return event.severity;

  const type = event.event_type;

  if (type === "login_failed") return "medium";
  if (type === "csrf_error") return "high";
  if (type === "rate_limit_violation" || type === "edge_abuse_detected") return "high";
  if (type === "suspicious_activity" || type === "analytics_abuse_detected") return "high";
  if (type === "login_success") return "low";
  if (type.startsWith("content_delete")) return "medium";

  return "low";
};

/**
 * Logs a security event via the edge function (captures IP server-side).
 * Fire-and-forget — never blocks the UI.
 *
 * Severity is always attached in metadata.severity for downstream dashboards.
 */
export const logSecurityEvent = (event: SecurityEvent) => {
  try {
    const severity = inferSeverity(event);
    const safeMetadata = {
      ...(event.metadata || {}),
      severity,
    };

    // Explicitly avoid putting secrets in logs; callers must not pass tokens/passwords here.
    supabase.functions
      .invoke("log-security-event", { body: { ...event, metadata: safeMetadata } })
      .catch((err) => console.warn("[SecurityLog] Failed to log event:", err));
  } catch {
    // Silently fail — logging should never break the app
  }
};
