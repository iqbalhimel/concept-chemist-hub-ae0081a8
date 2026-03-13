import { useCallback } from "react";
import { useCsrf } from "@/contexts/CsrfContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logSecurityEvent } from "@/lib/securityLogger";

/**
 * Returns a guard function that validates the CSRF token before executing a mutation.
 * Optionally logs the action as a security event.
 * Usage:
 *   const csrfGuard = useCsrfGuard();
 *   const handleSave = () => csrfGuard(async () => { ...mutation logic }, "content_update", "Updated FAQ item");
 */
export const useCsrfGuard = () => {
  const { token, validateToken } = useCsrf();
  const { user } = useAuth();

  const guard = useCallback(
    async <T>(
      mutation: () => Promise<T>,
      eventType?: string,
      description?: string
    ): Promise<T | undefined> => {
      if (!token) {
        toast.error("Security error: No CSRF token. Please refresh the page and log in again.");
        console.error("[CSRF] No token available — session may have expired.");
        logSecurityEvent({
          event_type: "csrf_error",
          description: "Missing CSRF token — possible session expiry",
          user_email: user?.email || undefined,
          user_id: user?.id || undefined,
        });
        return undefined;
      }

      if (!validateToken(token)) {
        toast.error("Security error: Invalid CSRF token. Request blocked.");
        console.error("[CSRF] Token validation failed — possible CSRF attack.");
        logSecurityEvent({
          event_type: "csrf_error",
          description: "Invalid CSRF token — possible CSRF attack",
          user_email: user?.email || undefined,
          user_id: user?.id || undefined,
        });
        return undefined;
      }

      const result = await mutation();

      // Log successful admin action if event info provided
      if (eventType) {
        logSecurityEvent({
          event_type: eventType,
          description: description || "",
          user_email: user?.email || undefined,
          user_id: user?.id || undefined,
        });
      }

      return result;
    },
    [token, validateToken, user]
  );

  return guard;
};

/**
 * Returns the current CSRF token value for embedding in forms.
 */
export const useCsrfToken = () => {
  const { token } = useCsrf();
  return token;
};
