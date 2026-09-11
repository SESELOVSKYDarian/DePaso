import Image from "next/image";
import { colors } from "@depaso/design-tokens";

const SECTIONS = [
  "Dashboard",
  "Usuarios",
  "Productos",
  "Marcas",
  "Comercios",
  "Sucursales",
  "Precios",
  "Histórico de precios",
  "Reportes comunitarios",
  "Precios disputados",
  "Moderación",
  "Confianza de usuarios",
  "Optimization Runs",
  "Configuración",
];

/**
 * Scaffold mínimo bootable del panel admin (sección 7 del master prompt). Las pantallas
 * reales de moderación/gestión necesitan auth + @depaso/database funcionando — quedan para
 * la Fase 20 (ver docs/development/IMPLEMENTATION-PLAN.md). Esto sólo confirma que la app
 * levanta y tiene el mapa de secciones previsto.
 */
export default function AdminHome() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image src="/logo-isotipo.png" alt="Isotipo DePaso" width={32} height={32} priority />
        <h1 style={{ fontSize: 24, margin: 0 }}>DePaso — Admin</h1>
      </div>
      <p style={{ color: colors.text.secondary }}>
        Panel administrativo. Secciones previstas (Fase 20, aún no implementadas):
      </p>
      <ul>
        {SECTIONS.map((section) => (
          <li key={section} style={{ color: colors.text.muted, marginBottom: 4 }}>
            {section}
          </li>
        ))}
      </ul>
    </main>
  );
}
