import type { AuthUserResponse, LoginRequest, RegisterRequest } from "@depaso/validation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "../apiClient";
import {
  clearStoredToken,
  getOnboardingSeen,
  getStoredToken,
  setOnboardingSeen as persistOnboardingSeen,
  setStoredToken,
} from "./secureStore";

interface AuthContextValue {
  /** `null` mientras se resuelve el estado guardado (SecureStore) al abrir la app. */
  isBootstrapping: boolean;
  onboardingSeen: boolean;
  user: AuthUserResponse | null;
  isAuthenticated: boolean;
  /** `false` sólo tras un `register()` recién hecho, hasta completar el setup posterior
   * (verificación/ubicación/lugares/intereses). Un `login()` de una cuenta existente entra
   * directo (`true`) — ese flujo es sólo para cuentas nuevas. Es estado de sesión, no
   * persistido: si la app se cierra a mitad del setup, al reabrir cae directo a `(tabs)`. */
  postSignupDone: boolean;
  completeOnboarding: () => Promise<void>;
  completePostSignup: () => void;
  register: (body: RegisterRequest) => Promise<void>;
  login: (body: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [onboardingSeen, setOnboardingSeenState] = useState(false);
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [postSignupDone, setPostSignupDone] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const [seen, token] = await Promise.all([getOnboardingSeen(), getStoredToken()]);
      if (cancelled) return;
      setOnboardingSeenState(seen);

      if (token) {
        try {
          const me = await authClient.me();
          if (!cancelled) setUser(me);
        } catch {
          // Token guardado ya no sirve (expiró/revocado) — se limpia y se manda a login.
          await clearStoredToken();
        }
      }
      if (!cancelled) setIsBootstrapping(false);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await persistOnboardingSeen();
    setOnboardingSeenState(true);
  }, []);

  const completePostSignup = useCallback(() => setPostSignupDone(true), []);

  const register = useCallback(async (body: RegisterRequest) => {
    const result = await authClient.register(body);
    await setStoredToken(result.token);
    setPostSignupDone(false);
    setUser(result.user);
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    const result = await authClient.login(body);
    await setStoredToken(result.token);
    setPostSignupDone(true);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authClient.logout();
    } finally {
      await clearStoredToken();
      setPostSignupDone(true);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authClient.me();
    setUser(me);
  }, []);

  /** El DELETE ya revoca la sesión server-side (apps/api/app/api/auth/account) — no hace
   * falta un logout() aparte, sólo limpiar el estado local. */
  const deleteAccount = useCallback(async () => {
    await authClient.deleteAccount();
    await clearStoredToken();
    setPostSignupDone(true);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      onboardingSeen,
      user,
      isAuthenticated: user !== null,
      postSignupDone,
      completeOnboarding,
      completePostSignup,
      register,
      login,
      logout,
      refreshUser,
      deleteAccount,
    }),
    [
      isBootstrapping,
      onboardingSeen,
      user,
      postSignupDone,
      completeOnboarding,
      completePostSignup,
      register,
      login,
      logout,
      refreshUser,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
