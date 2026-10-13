import * as Crypto from "expo-crypto";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "../config";

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
 * URL que se registra en la consola de cada proveedor (Google, Meta, Discord). Es una sola,
 * https, y vive en el backend: recibe el `code` y lo reenvía a la app (ver
 * `apps/api/app/api/auth/oauth/callback`). Así funciona igual en Expo Go y en un build.
 */
export function getProviderRedirectUri(): string {
  return `${API_BASE_URL}/api/auth/oauth/callback`;
}

/** URI con la que el backend devuelve el control a la app. */
function getAppReturnUri(): string {
  return AuthSession.makeRedirectUri({ scheme: "depaso", path: "auth/callback" });
}

/**
 * Abre la pantalla del proveedor (authorization code + PKCE) y devuelve el `code`. El canje
 * por tokens lo hace el backend, que es el único que conoce el client secret.
 * Devuelve `null` si la persona cancela o cierra la ventana.
 */
export async function requestAuthorizationCode(info: OAuthProviderInfo): Promise<AuthorizationResult | null> {
  const returnUri = getAppReturnUri();
  const redirectUri = getProviderRedirectUri();
  const nonce = Array.from(await Crypto.getRandomBytesAsync(16), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const state = `${nonce}|${returnUri}`;

  const request = new AuthSession.AuthRequest({
    clientId: info.clientId,
    scopes: info.scopes,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    state,
  });
  const authUrl = await request.makeAuthUrlAsync({ authorizationEndpoint: info.authorizationEndpoint });
  const codeVerifier = request.codeVerifier;
  if (!codeVerifier) throw new Error("oauth_pkce_missing");

  const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUri);
  if (result.type !== "success") return null;

  const query = Linking.parse(result.url).queryParams ?? {};
  const code = typeof query.code === "string" ? query.code : null;
  const returnedState = typeof query.state === "string" ? query.state : null;
  if (typeof query.error === "string") {
    if (query.error === "access_denied") return null;
    throw new Error(query.error);
  }
  if (!code || returnedState !== state) throw new Error("oauth_invalid_response");

  return { code, redirectUri, codeVerifier };
}
