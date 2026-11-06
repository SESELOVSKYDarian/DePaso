/**
 * Destino de la redirección `depaso://auth/callback` del login social. El navegador de
 * autenticación la intercepta, pero Android igual se la entrega a la app. No muestra nada: el
 * hook `useStageRedirect` la detecta como pantalla suelta y manda a la persona a la pantalla que
 * le toca según su sesión (con `Redirect href="/"` quedaba "Unmatched Route" cuando le tocaba la
 * configuración inicial, porque "/" no existe en esa etapa).
 */
export default function OAuthCallbackScreen() {
  return null;
}
