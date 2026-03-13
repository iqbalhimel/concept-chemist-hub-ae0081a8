import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CsrfContextType {
  token: string | null;
  validateToken: (submittedToken: string) => boolean;
  regenerateToken: () => string;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const CsrfProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  // Generate a new token when admin session starts
  useEffect(() => {
    if (user && isAdmin) {
      setToken(generateToken());
    } else {
      setToken(null);
    }
  }, [user, isAdmin]);

  const validateToken = useCallback(
    (submittedToken: string): boolean => {
      if (!token || !submittedToken) return false;
      // Constant-time comparison to prevent timing attacks
      if (token.length !== submittedToken.length) return false;
      let result = 0;
      for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ submittedToken.charCodeAt(i);
      }
      return result === 0;
    },
    [token]
  );

  const regenerateToken = useCallback((): string => {
    const newToken = generateToken();
    setToken(newToken);
    return newToken;
  }, []);

  return (
    <CsrfContext.Provider value={{ token, validateToken, regenerateToken }}>
      {children}
    </CsrfContext.Provider>
  );
};

export const useCsrf = (): CsrfContextType => {
  const ctx = useContext(CsrfContext);
  if (!ctx) throw new Error("useCsrf must be used within CsrfProvider");
  return ctx;
};
