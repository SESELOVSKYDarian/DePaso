"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

const MIN_LENGTH = 8;

const page: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "#F5F5F7",
  color: "#1D1D1F",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};
const card: CSSProperties = {
  width: "100%",
  maxWidth: 380,
  background: "#FFFFFF",
  borderRadius: 20,
  padding: 28,
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
};
const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 48,
  borderRadius: 12,
  border: "1px solid #C7C7CC",
  padding: "0 14px",
  fontSize: 16,
  marginBottom: 12,
};
const button: CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: 999,
  border: 0,
  background: "#1D1D1F",
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

/** Página a la que lleva el link del mail de "Olvidé mi contraseña". */
export default function ResetPasswordPage() {
  const token = typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(`La contraseña necesita al menos ${MIN_LENGTH} caracteres.`);
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (response.ok) return setDone(true);
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(
        body?.error === "INVALID_OR_EXPIRED_TOKEN"
          ? "El link venció o ya se usó. Pedí uno nuevo desde la app."
          : "No pudimos cambiar la contraseña. Probá de nuevo."
      );
    } catch {
      setError("No pudimos conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>DePaso</h1>
        {done ? (
          <>
            <p style={{ fontSize: 17, fontWeight: 600 }}>Listo, ya cambiaste tu contraseña.</p>
            <p style={{ color: "#515154" }}>Volvé a la app e iniciá sesión con la nueva.</p>
          </>
        ) : !token ? (
          <p style={{ color: "#515154" }}>Este link no es válido. Pedí uno nuevo desde la app.</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <p style={{ color: "#515154", margin: "0 0 16px" }}>Elegí tu contraseña nueva.</p>
            <input
              style={input}
              type="password"
              autoComplete="new-password"
              placeholder="Contraseña nueva"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <input
              style={input}
              type="password"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {error ? <p style={{ color: "#C4343A", fontSize: 14, margin: "0 0 12px" }}>{error}</p> : null}
            <button style={{ ...button, opacity: busy ? 0.6 : 1 }} type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
