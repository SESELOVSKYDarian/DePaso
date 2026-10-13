import { Redirect } from "expo-router";

/**
 * Destino de la redirección `depaso://auth/callback` del login social. El navegador de
 * autenticación la intercepta antes de llegar acá; esta ruta sólo evita un "pantalla no
 * encontrada" si el sistema igualmente la entrega a la app.
 */
export default function OAuthCallbackScreen() {
  return <Redirect href="/" />;
}
