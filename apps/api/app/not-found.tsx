/**
 * Sin esto, Next.js genera su página 404 por defecto con el mismo mecanismo legado que
 * rompe el build de producción ("Cannot read properties of null (reading 'useContext')",
 * ver global-error.tsx). Esta API no tiene UI propia — sólo evita ese fallback.
 */
export default function NotFound() {
  return <p>No encontrado.</p>;
}
