import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

type AdminAuthContextType = {
  session: { email: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
};

const TOKEN_KEY = "tasty-point-admin-token";

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async (token: string) => {
    const { ok, data } = await apiFetch("/api/admin/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (ok && data.email) {
      setAuthTokenGetter(() => token);
      setSession({ email: data.email as string });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthTokenGetter(null);
      setSession(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      verify(stored);
    } else {
      setLoading(false);
    }
  }, [verify]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const { ok, data } = await apiFetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (ok && data.token) {
      const token = data.token as string;
      localStorage.setItem(TOKEN_KEY, token);
      setAuthTokenGetter(() => token);
      setSession({ email: data.email as string });
      return {};
    }
    return { error: (data.error as string) ?? "Login failed" };
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthTokenGetter(null);
    setSession(null);
  };

  return (
    <AdminAuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
