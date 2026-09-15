"use client";

import { colors, spacing } from "@depaso/design-tokens";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAdminAuth } from "@/lib/AdminAuthContext";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/stores", label: "Comercios y sucursales" },
  { href: "/prices", label: "Precios" },
  { href: "/price-reports", label: "Reportes y moderación" },
  { href: "/users", label: "Usuarios" },
  { href: "/optimization-runs", label: "Optimization runs" },
];

/** Gate de auth + nav del panel. Redirige a `/login` si no hay sesión ADMIN válida. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, isBootstrapping, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isBootstrapping && !admin && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isBootstrapping, admin, pathname, router]);

  if (pathname === "/login") return <>{children}</>;

  if (isBootstrapping) {
    return <main style={{ padding: spacing.xl }}>Cargando...</main>;
  }

  if (!admin) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 220,
          borderRight: `1px solid ${colors.border.subtle}`,
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacing.xs,
        }}
      >
        <strong style={{ marginBottom: spacing.md }}>DePaso Admin</strong>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} style={{ color: colors.text.primary, fontSize: 14, textDecoration: "none" }}>
            {item.label}
          </Link>
        ))}
        <div style={{ marginTop: "auto", fontSize: 12, color: colors.text.secondary }}>
          <p style={{ marginBottom: spacing.xs }}>{admin.email}</p>
          <button
            onClick={logout}
            style={{ border: "none", background: "none", color: colors.brand.route, cursor: "pointer", padding: 0, fontSize: 13 }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: spacing.xl }}>{children}</main>
    </div>
  );
}
