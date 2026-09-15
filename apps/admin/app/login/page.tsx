"use client";

import { colors, radii, spacing } from "@depaso/design-tokens";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/AdminAuthContext";

export default function AdminLoginPage() {
  const { login, error, admin } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (admin) router.replace("/");
  }, [admin, router]);

  if (admin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 360, margin: "96px auto", padding: `0 ${spacing.lg}px` }}>
      <h1 style={{ fontSize: 22, marginBottom: spacing.xs }}>DePaso — Admin</h1>
      <p style={{ color: colors.text.secondary, fontSize: 13, marginBottom: spacing.lg }}>
        Sólo cuentas con permisos de administrador. Sin MFA todavía (brecha conocida, ver
        docs/development/DECISIONS.md) — no usar con datos de producción reales.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error ? <p style={{ color: colors.state.error, fontSize: 13, margin: 0 }}>{error}</p> : null}
        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: radii.md,
  border: `1px solid ${colors.border.subtle}`,
  backgroundColor: colors.surface.input,
  padding: `0 ${spacing.md}px`,
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: radii.lg,
  border: "none",
  backgroundColor: colors.brand.navy,
  color: colors.text.onNavy,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};
