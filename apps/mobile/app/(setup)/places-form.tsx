/**
 * Alias del mismo formulario que `places/form.tsx`, alcanzable dentro del stack propio de
 * `(setup)` en vez de compartir el nombre de ruta con la copia de `places/form` del stack
 * raíz. Registrar la misma `name` de `Stack.Screen` en dos `Stack.Protected` hermanos
 * rompía la resolución de `router.push` (bug real: "route not handled by any navigator",
 * encontrado probando "Mis lugares" con la app corriendo) — esta ruta separada evita la
 * colisión sin duplicar la lógica del formulario.
 */
export { default } from "../places/form";
