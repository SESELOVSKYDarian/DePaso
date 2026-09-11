import type { ReactNode } from "react";
import Link from "next/link";
import { colors } from "@depaso/design-tokens";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 96px" }}>
      <Link href="/" style={{ color: colors.brand.route, fontSize: 14 }}>
        ← DePaso
      </Link>
      <h1 style={{ fontFamily: "var(--font-brand), sans-serif", fontSize: 32, marginTop: 16 }}>
        {title}
      </h1>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: colors.text.secondary }}>{children}</div>
    </main>
  );
}

export function PendingNotice() {
  return (
    <p
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.surface.secondary,
        color: colors.text.primary,
        fontSize: 14,
      }}
    >
      Este documento tiene campos pendientes de completar con datos reales del negocio
      (razón social, CUIT, domicilio legal, emails de contacto) antes del lanzamiento —
      ver <code>docs/legal-functional/LEGAL.md</code> (checklist pre-lanzamiento). No se
      inventan acá para no publicar información falsa.
    </p>
  );
}
