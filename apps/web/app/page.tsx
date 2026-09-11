import Image from "next/image";
import Link from "next/link";
import { colors } from "@depaso/design-tokens";

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Image
          src="/logo-isotipo.png"
          alt="Isotipo DePaso"
          width={84}
          height={84}
          priority
        />
        <div>
          <h1
            style={{
              fontFamily: "var(--font-brand), sans-serif",
              fontSize: 56,
              lineHeight: 1,
              margin: 0,
            }}
          >
            <span style={{ color: colors.brand.navy }}>De</span>
            <span style={{ color: colors.brand.route }}>Paso</span>
          </h1>
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: colors.text.primary,
              margin: "4px 0 0",
            }}
          >
            Ahorrá en el camino<span style={{ color: colors.saving.lime }}>.</span>
          </p>
        </div>
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.6, color: colors.text.secondary, marginTop: 32 }}>
        DePaso te dice dónde realmente te conviene comprar hoy, según el camino que ya vas a
        hacer — no sólo dónde está más barato. Por ahora, sólo en Mar del Plata.
      </p>

      <div style={{ marginTop: 40, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            backgroundColor: colors.surface.primary,
            border: `1px solid ${colors.border.subtle}`,
            color: colors.text.muted,
            fontSize: 14,
          }}
        >
          App para Android / iOS — próximamente
        </span>
      </div>

      <nav style={{ marginTop: 64, display: "flex", gap: 24, fontSize: 14 }}>
        <Link href="/privacy" style={{ color: colors.brand.route }}>
          Privacidad
        </Link>
        <Link href="/terms" style={{ color: colors.brand.route }}>
          Términos
        </Link>
        <Link href="/community-guidelines" style={{ color: colors.brand.route }}>
          Normas de la comunidad
        </Link>
      </nav>
    </main>
  );
}
