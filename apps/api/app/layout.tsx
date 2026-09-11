export const metadata = {
  title: "DePaso API",
  description: "Capa de presentación (route handlers) de DePaso.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
