import { useCallback } from "react";
import { useCsrf } from "@/contexts/CsrfContext";
import { toast } from "sonner";

/**
 * Returns a guard function that validates the CSRF token before executing a mutation.
 * Usage:
 *   const csrfGuard = useCsrfGuard();
 *   const handleSave = () => csrfGuard(async () => { ...mutation logic });
 */
export const useCsrfGuard = () => {
  const { token, validateToken } = useCsrf();

  const guard = useCallback(
    async <T>(mutation: () => Promise<T>): Promise<T | undefined> => {
      if (!token) {
        toast.error("Security error: No CSRF token. Please refresh the page and log in again.");
        console.error("[CSRF] No token available — session may have expired.");
        return undefined;
      }

      if (!validateToken(token)) {
        toast.error("Security error: Invalid CSRF token. Request blocked.");
        console.error("[CSRF] Token validation failed — possible CSRF attack.");
        return undefined;
      }

      return mutation();
    },
    [token, validateToken]
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
