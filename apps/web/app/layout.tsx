import { Fredoka, Montserrat } from "next/font/google";
import { colors } from "@depaso/design-tokens";
import type { ReactNode } from "react";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["700"], variable: "--font-brand" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata = {
  title: "DePaso — Ahorrá en el camino",
  description:
    "Asistente de conveniencia cotidiana que calcula qué compra conviene según tu recorrido real. Mar del Plata, Argentina.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${fredoka.variable} ${montserrat.variable}`}>
      <body
        style={{
          margin: 0,
          backgroundColor: colors.surface.base,
          color: colors.text.primary,
          fontFamily: "var(--font-body), system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
