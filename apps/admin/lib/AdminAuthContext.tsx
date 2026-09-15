"use client";

import type { AuthUserResponse } from "@depaso/validation";
import { ApiError } from "@depaso/api-client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient, getStoredAdminToken, setStoredAdminToken } from "./apiClient";

interface AdminAuthContextValue {
  admin: AuthUserResponse | null;
  isBootstrapping: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * Reusa `/api/auth/login` (misma sesión que `apps/mobile`) — sólo agrega el chequeo de
 * `role === "ADMIN"` en el cliente (el servidor ya lo re-valida en cada endpoint de
 * `/api/admin/*` vía `requireAdmin`, así que esto es UX, no el control de seguridad real).
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthUserResponse | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    authClient
      .me()
      .then((user) => {
        if (user.role !== "ADMIN") {
          setStoredAdminToken(null);
          setAdmin(null);
        } else {
          setAdmin(user);
        }
      })
      .catch(() => setStoredAdminToken(null))
      .finally(() => setIsBootstrapping(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { user, token } = await authClient.login({ email, password });
      if (user.role !== "ADMIN") {
        setError("Esta cuenta no tiene permisos de administrador.");
        return;
      }
      setStoredAdminToken(token);
      setAdmin(user);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? "Demasiados intentos — probá en unos minutos." : "Email o contraseña incorrectos.");
    }
  }, []);

  const logout = useCallback(() => {
    setStoredAdminToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ admin, isBootstrapping, error, login, logout }),
    [admin, isBootstrapping, error, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth debe usarse dentro de <AdminAuthProvider>");
  return ctx;
}
