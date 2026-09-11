import { colors } from "@depaso/design-tokens";
import type { ReactNode } from "react";

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
        {children}
      </body>
    </html>
  );
}
