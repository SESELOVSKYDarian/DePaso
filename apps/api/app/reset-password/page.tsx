"use client";

import { useState, type FormEvent } from "react";

const MIN_LENGTH = 8;

const CSS = `
  :root { color-scheme: light dark; --bg:#F5F5F7; --card:#FFFFFF; --text:#1D1D1F; --muted:#6E6E73; --line:#D2D2D7;
          --input:#F5F5F7; --btn:#1D1D1F; --btn-text:#FFFFFF; --error:#C4343A; --ok:#1F7A4D; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#000000; --card:#1C1C1E; --text:#F5F5F7; --muted:#A1A1A6; --line:#38383A;
            --input:#2C2C2E; --btn:#F5F5F7; --btn-text:#000000; --error:#FF6961; --ok:#5DE08A; }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); }
  .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
          background: var(--bg); color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .card { width: 100%; max-width: 400px; background: var(--card); border-radius: 24px; padding: 32px 28px 28px;
          box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.08); animation: rise .35s cubic-bezier(.23,1,.32,1) both; }
  @keyframes rise { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
  .logo { width: 56px; height: 56px; border-radius: 14px; display: block; margin: 0 0 20px; }
  h1 { margin: 0 0 6px; font-size: 24px; line-height: 30px; letter-spacing: -.01em; }
  p.lead { margin: 0 0 22px; color: var(--muted); font-size: 15px; line-height: 22px; }
  .field { position: relative; margin-bottom: 12px; }
  .field input { width: 100%; min-height: 52px; border-radius: 14px; border: 1px solid var(--line); background: var(--input);
                 color: var(--text); font-size: 16px; padding: 0 48px 0 16px; outline: none; transition: border-color .15s, box-shadow .15s; }
  .field input:focus { border-color: var(--text); box-shadow: 0 0 0 3px color-mix(in srgb, var(--text) 14%, transparent); }
  .toggle { position: absolute; right: 6px; top: 6px; min-width: 40px; height: 40px; border: 0; background: transparent;
            color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 10px; }
  .hint { margin: 2px 2px 14px; font-size: 13px; color: var(--muted); }
  .error { margin: 0 0 12px; font-size: 14px; color: var(--error); }
  button.primary { width: 100%; min-height: 52px; border: 0; border-radius: 999px; background: var(--btn); color: var(--btn-text);
                   font-size: 16px; font-weight: 600; cursor: pointer; transition: transform .12s ease-out, opacity .15s; }
  button.primary:active { transform: scale(.98); }
  button.primary:disabled { opacity: .55; cursor: default; }
  a.secondary { display: block; text-align: center; margin-top: 16px; color: var(--muted); font-size: 14px; text-decoration: underline; }
  .badge { width: 48px; height: 48px; border-radius: 999px; display: grid; place-items: center; margin: 0 0 18px;
           background: color-mix(in srgb, var(--ok) 16%, transparent); color: var(--ok); font-size: 26px; }
`;

const LOGO = (
  <svg className="logo" viewBox="0 0 1024 1024" role="img" aria-label="DePaso">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2C2C2E" />
        <stop offset="1" stopColor="#050506" />
      </linearGradient>
      <clipPath id="di">
        <path d="M50 34H134A94 94 0 0 1 134 222H50A22 22 0 0 1 28 200V56A22 22 0 0 1 50 34Z" />
      </clipPath>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" />
    <g transform="translate(161.4 166.5) scale(2.5781)">
      <g clipPath="url(#di)">
        <rect width="256" height="256" fill="#F5F5F7" />
        <path
          fill="#7DDBC0"
          d="M88 34H134A94 94 0 0 1 134 222H50A22 22 0 0 1 28 200V172C52 160 84 160 108 170C140 182 178 160 190 118C200 84 160 48 124 40C108 36 98 34 88 34Z"
        />
        <path fill="#4A9BEA" d="M224.8 103.7A94 94 0 0 1 89.9 211A150 150 0 0 0 224.8 103.7Z" />
        <path fill="#4A9BEA" d="M89.9 211A94 94 0 0 0 134 222H80Z" />
        <g fill="none" stroke="#1D1D1F" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="136" cy="108" r="30" strokeWidth="16" />
          <path strokeWidth="22" d="M22 246C70 214 128 204 134 150" />
        </g>
      </g>
      <path
        fill="#B7FF1A"
        transform="translate(136 110) scale(1.18) translate(-136 -110)"
        d="M136 90.5a11.5 11.5 0 0 1 11.5 11.5c0 8.5-8 15.5-11.5 22c-3.5-6.5-11.5-13.5-11.5-22A11.5 11.5 0 0 1 136 90.5Z"
      />
    </g>
  </svg>
);

/** Página de respaldo del link del mail: elegir la contraseña nueva desde el navegador. */
export default function ResetPasswordPage() {
  const token = typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
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
          : "No pudimos cambiar la contraseña. Probá de nuevo.",
      );
    } catch {
      setError("No pudimos conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <style>{CSS}</style>
      <div className="card">
        {done ? (
          <>
            <div className="badge" aria-hidden="true">
              ✓
            </div>
            <h1>Listo, ya cambiaste tu contraseña</h1>
            <p className="lead">Volvé a DePaso e iniciá sesión con la nueva. Tus listas te esperan.</p>
            <a className="secondary" href="depaso://">
              Abrir la app
            </a>
          </>
        ) : !token ? (
          <>
            {LOGO}
            <h1>Este link no es válido</h1>
            <p className="lead">Pedí uno nuevo desde la app, en “Olvidé mi contraseña”.</p>
          </>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            {LOGO}
            <h1>Elegí tu contraseña nueva</h1>
            <p className="lead">Usala solo para DePaso. Tiene que tener al menos {MIN_LENGTH} caracteres.</p>
            <div className="field">
              <input
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Contraseña nueva"
                aria-label="Contraseña nueva"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="button" className="toggle" onClick={() => setReveal((value) => !value)}>
                {reveal ? "Ocultar" : "Ver"}
              </button>
            </div>
            <div className="field">
              <input
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repetila"
                aria-label="Repetir contraseña"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
