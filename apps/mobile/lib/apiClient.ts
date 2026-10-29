import {
  createAccountExportClient,
  createApiClient,
  createAuthClient,
  createAdminMerchantClient,
  createConsentClient,
  createMerchantClient,
  createGeocodeClient,
  createHomeClient,
  createActivityClient,
  createListsClient,
  createOptimizationClient,
  createPaymentsClient,
  createPlacesClient,
  createPreferencesClient,
  createMapConfigClient,
  createAssistantClient,
  createPriceReportsClient,
  createProductsClient,
  createRouteComputeClient,
  createRouteContextClient,
  createStoresClient,
} from "@depaso/api-client";
import { API_BASE_URL } from "./config";
import { clearStoredToken, getStoredRefreshToken, getStoredToken, setStoredSession } from "./auth/secureStore";

/** Cliente sin renovación automática: se usa sólo para canjear el refresh token. */
const bareClient = createApiClient({ baseUrl: API_BASE_URL });

let refreshInFlight: Promise<string | null> | null = null;

/** Se llama cuando la sesión murió (refresh token inválido o vencido): la app vuelve al login. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

/**
 * Canjea el refresh token por un par nuevo de tokens. Si varias requests fallan a la vez
 * comparten un único canje. Devuelve el access token nuevo, o null si la sesión no se
 * pudo renovar (en ese caso se limpia el almacén y se avisa para volver al login).
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) return null;
      const result = await createAuthClient(bareClient).refresh(refreshToken);
      await setStoredSession(result.token, result.refreshToken);
      return result.token;
    } catch (error) {
      // sólo un rechazo del servidor (401/400) termina la sesión; un corte de red no
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 400) {
        await clearStoredToken();
        onSessionExpired?.();
      }
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** El access token (JWT) viaja como header `Authorization: Bearer` en mobile (no hay cookies
 * de navegador) — se lee de SecureStore en cada request y se renueva solo al vencer. */
const client = createApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: () => getStoredToken(),
  onUnauthorized: refreshAccessToken,
});

export const authClient = createAuthClient(client);
export const consentClient = createConsentClient(client);
export const placesClient = createPlacesClient(client);
export const routeContextClient = createRouteContextClient(client);
export const productsClient = createProductsClient(client);
export const listsClient = createListsClient(client);
export const preferencesClient = createPreferencesClient(client);
export const storesClient = createStoresClient(client);
export const geocodeClient = createGeocodeClient(client);
export const optimizationClient = createOptimizationClient(client);
export const priceReportsClient = createPriceReportsClient(client);
export const accountExportClient = createAccountExportClient(client);
export const routeComputeClient = createRouteComputeClient(client);
export const mapConfigClient = createMapConfigClient(client);
export const merchantClient = createMerchantClient(client);
export const adminMerchantClient = createAdminMerchantClient(client);
export const paymentsClient = createPaymentsClient(client);
export const activityClient = createActivityClient(client);
export const assistantClient = createAssistantClient(client);
export const homeClient = createHomeClient(client);
