"use client";

/**
 * Sin esto, Next.js genera su página de error por defecto (`/500`) con un mecanismo
 * legado que falla al prerenderizar en este proyecto ("Cannot read properties of null
 * (reading 'useContext')", bug real encontrado armando el build de producción) — esta
 * API no tiene UI propia, así que este boundary sólo existe para evitar ese fallback.
 */
export default function GlobalError() {
  return (
    <html lang="es-AR">
      <body>
        <p>Error interno.</p>
      </body>
    </html>
  );
}
