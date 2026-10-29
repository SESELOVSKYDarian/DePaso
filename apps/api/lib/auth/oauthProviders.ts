import type { OAuthProviderId } from "@depaso/validation";

/**
 * Login social (Google, Meta/Facebook, Discord) con authorization code + PKCE.
 *
 * La app abre la pantalla del proveedor y recibe un `code`; acá se canjea por un token y se
 * lee el perfil. El client secret nunca sale del servidor. Cada proveedor se activa con sus
 * variables de entorno — sin ellas el endpoint responde `PROVIDER_NOT_CONFIGURED`.
 */

export interface OAuthProfile {
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

interface ProviderDefinition {
  id: OAuthProviderId;
  label: string;
  /** Nombres de variable aceptados, en orden de preferencia. */
  clientIdEnv: string[];
  clientSecretEnv: string[];
  /** Google acepta clientes públicos (iOS/Android) sin secret; el resto lo exige. */
  secretRequired: boolean;
  authorizationEndpoint: string;
  scopes: string[];
  fetchProfile(input: ExchangeInput): Promise<OAuthProfile>;
}

interface ExchangeInput {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string | null;
}

class OAuthError extends Error {}
export { OAuthError };

/** Lee la respuesta JSON del proveedor; si vino un error HTTP, falla con `OAuthError`. */
async function readJson(response: Response): Promise<Record<string, unknown>> {
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !body) throw new OAuthError(`Respuesta ${response.status} del proveedor`);
  return body;
}

/** Devuelve el valor solo si es un texto no vacío; si no, null. */
function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** POST de formulario al proveedor (con 8 segundos de límite). */
async function formPost(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(8000),
  });
  return readJson(response);
}

/** Parámetros para canjear el `code` por un token (con PKCE; el secret solo si existe). */
function codeParams(input: ExchangeInput): Record<string, string> {
  const params: Record<string, string> = {
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
    code_verifier: input.codeVerifier,
  };
  if (input.clientSecret) params.client_secret = input.clientSecret;
  return params;
}

const google: ProviderDefinition = {
  id: "google",
  label: "Google",
  clientIdEnv: ["GOOGLE_CLIENT_ID"],
  clientSecretEnv: ["GOOGLE_CLIENT_SECRET"],
  secretRequired: false,
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  scopes: ["openid", "email", "profile"],
  async fetchProfile(input) {
    const token = await formPost("https://oauth2.googleapis.com/token", codeParams(input));
    const accessToken = asString(token.access_token);
    if (!accessToken) throw new OAuthError("Google no devolvió access_token");
    const info = await readJson(
      await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(8000),
      })
    );
    return {
      providerUserId: asString(info.sub) ?? "",
      email: asString(info.email),
      emailVerified: info.email_verified === true,
      name: asString(info.name),
    };
  },
};

const facebook: ProviderDefinition = {
  id: "facebook",
  label: "Meta",
  clientIdEnv: ["META_APP_ID", "FACEBOOK_APP_ID"],
  clientSecretEnv: ["META_APP_SECRET", "FACEBOOK_APP_SECRET"],
  secretRequired: true,
  authorizationEndpoint: "https://www.facebook.com/v19.0/dialog/oauth",
  scopes: ["email", "public_profile"],
  async fetchProfile(input) {
    const token = await formPost("https://graph.facebook.com/v19.0/oauth/access_token", codeParams(input));
    const accessToken = asString(token.access_token);
    if (!accessToken) throw new OAuthError("Meta no devolvió access_token");
    const me = await readJson(
      await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
        { signal: AbortSignal.timeout(8000) }
      )
    );
    // Meta sólo devuelve emails que la persona confirmó en su cuenta.
    return {
      providerUserId: asString(me.id) ?? "",
      email: asString(me.email),
      emailVerified: asString(me.email) !== null,
      name: asString(me.name),
    };
  },
};

const discord: ProviderDefinition = {
  id: "discord",
  label: "Discord",
  clientIdEnv: ["DISCORD_CLIENT_ID"],
  clientSecretEnv: ["DISCORD_CLIENT_SECRET"],
  secretRequired: true,
  authorizationEndpoint: "https://discord.com/oauth2/authorize",
  scopes: ["identify", "email"],
  async fetchProfile(input) {
    const token = await formPost("https://discord.com/api/oauth2/token", codeParams(input));
    const accessToken = asString(token.access_token);
    if (!accessToken) throw new OAuthError("Discord no devolvió access_token");
    const me = await readJson(
      await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(8000),
      })
    );
    return {
      providerUserId: asString(me.id) ?? "",
      email: asString(me.email),
      emailVerified: me.verified === true,
      name: asString(me.global_name) ?? asString(me.username),
    };
  },
};

const PROVIDERS: Record<OAuthProviderId, ProviderDefinition> = { google, facebook, discord };

/** Redes sociales disponibles y si tienen sus claves cargadas en el servidor. */
export function listProviders() {
  return Object.values(PROVIDERS).map((provider) => {
    const credentials = readCredentials(provider);
    return {
      id: provider.id,
      label: provider.label,
      configured: credentials !== null,
      clientId: credentials?.clientId ?? null,
      authorizationEndpoint: provider.authorizationEndpoint,
      scopes: provider.scopes,
    };
  });
}

/** Lee del entorno el client id y secret de un proveedor; null si no está configurado. */
function readCredentials(provider: ProviderDefinition): { clientId: string; clientSecret: string | null } | null {
  const firstSet = (names: string[]) => names.map((name) => process.env[name]?.trim()).find(Boolean);
  const clientId = firstSet(provider.clientIdEnv);
  const clientSecret = firstSet(provider.clientSecretEnv) || null;
  if (!clientId) return null;
  if (provider.secretRequired && !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Canjea el code y devuelve el perfil, o `null` si el proveedor no está configurado. */
export async function exchangeCodeForProfile(
  providerId: OAuthProviderId,
  params: { code: string; redirectUri: string; codeVerifier: string }
): Promise<OAuthProfile | null> {
  const provider = PROVIDERS[providerId];
  const credentials = readCredentials(provider);
  if (!credentials) return null;
  const profile = await provider.fetchProfile({ ...params, ...credentials });
  if (!profile.providerUserId) throw new OAuthError("El proveedor no devolvió un id de usuario");
  return profile;
}
