import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "@/lib/api";

interface User { id: number; email: string; full_name?: string; company_name?: string; plan: string; }
interface AuthCtxType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (d: { email: string; password: string; full_name?: string; company_name?: string }) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthCtxType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authAPI.getMe()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem("access_token"))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const r = await authAPI.login(email, password);
    localStorage.setItem("access_token", r.data.access_token);
    const me = await authAPI.getMe();
    setUser(me.data);
  };

  const register = async (d: any) => {
    await authAPI.register(d);
    await login(d.email, d.password);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/auth";
  };

  return (
    <AuthCtx.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
