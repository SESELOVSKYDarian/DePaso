import { colors } from "@depaso/design-tokens";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminAuthProvider } from "@/lib/AdminAuthContext";

export const metadata = { title: "DePaso Admin" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          backgroundColor: colors.surface.base,
          color: colors.text.primary,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
