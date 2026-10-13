import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Cierra la ventana del navegador cuando el proveedor vuelve a la app.
WebBrowser.maybeCompleteAuthSession();

export interface OAuthProviderInfo {
  clientId: string;
  authorizationEndpoint: string;
  scopes: string[];
}

export interface AuthorizationResult {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

/**
 * URI a la que vuelve el proveedor. Hay que registrarla tal cual en la consola de cada uno:
 * en Expo Go es `exp://<ip>:8081/--/auth/callback`; en un build, `depaso://auth/callback`.
 */
export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: "depaso", path: "auth/callback" });
}

/**
 * Abre la pantalla del proveedor (authorization code + PKCE) y devuelve el `code`. El canje
 * por tokens lo hace el backend, que es el único que conoce el client secret.
 * Devuelve `null` si la persona cancela o cierra la ventana.
 */
export async function requestAuthorizationCode(info: OAuthProviderInfo): Promise<AuthorizationResult | null> {
  const redirectUri = getRedirectUri();
  const request = new AuthSession.AuthRequest({
    clientId: info.clientId,
    scopes: info.scopes,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync({ authorizationEndpoint: info.authorizationEndpoint });
  if (result.type === "cancel" || result.type === "dismiss" || result.type === "locked") return null;
  if (result.type !== "success" || !result.params.code || !request.codeVerifier) {
    throw new Error(result.type === "error" ? (result.error?.message ?? "oauth_error") : "oauth_error");
  }
  return { code: result.params.code, redirectUri, codeVerifier: request.codeVerifier };
}
