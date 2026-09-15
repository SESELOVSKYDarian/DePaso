import Image from "next/image";
import Link from "next/link";
import { colors } from "@depaso/design-tokens";

const PENDING = ["Productos (catálogo)", "Marcas", "Histórico de precios (lectura)"];

/**
 * Dashboard del panel admin (sección 7 del master prompt). Fase 11/12 (comercios/
 * sucursales/precios), Fase 13-14 (reportes y moderación) y Fase 20 (usuarios,
 * optimization runs) tienen CRUD/lectura real — ver
 * `docs/development/IMPLEMENTATION-PLAN.md`. "Configuración" quedó NO DEFINIDO: ninguna
 * doc especifica qué debería tener, así que no se armó una pantalla con ajustes
 * inventados.
 */
export default function AdminHome() {
  return (
    <main style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image src="/logo-isotipo.png" alt="Isotipo DePaso" width={32} height={32} priority />
        <h1 style={{ fontSize: 24, margin: 0 }}>DePaso — Admin</h1>
      </div>

      <p style={{ color: colors.text.secondary }}>Secciones con CRUD/lectura real:</p>
      <ul>
        <li>
          <Link href="/stores">Comercios y sucursales</Link>
        </li>
        <li>
          <Link href="/prices">Precios</Link>
        </li>
        <li>
          <Link href="/price-reports">Reportes comunitarios y moderación</Link>
        </li>
        <li>
          <Link href="/users">Usuarios</Link>
        </li>
        <li>
          <Link href="/optimization-runs">Optimization runs</Link>
        </li>
      </ul>

      <p style={{ color: colors.text.secondary, marginTop: 24 }}>Secciones previstas, aún no implementadas:</p>
      <ul>
        {PENDING.map((section) => (
          <li key={section} style={{ color: colors.text.muted, marginBottom: 4 }}>
            {section}
          </li>
        ))}
      </ul>
    </main>
  );
}
