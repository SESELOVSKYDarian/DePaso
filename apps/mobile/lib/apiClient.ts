import {
  createAccountExportClient,
  createApiClient,
  createAuthClient,
  createAdminMerchantClient,
  createConsentClient,
  createMerchantClient,
  createGeocodeClient,
  createListsClient,
  createOptimizationClient,
  createPlacesClient,
  createPreferencesClient,
  createMapConfigClient,
  createPriceReportsClient,
  createProductsClient,
  createRouteComputeClient,
  createRouteContextClient,
  createStoresClient,
} from "@depaso/api-client";
import { API_BASE_URL } from "./config";
import { getStoredToken } from "./auth/secureStore";

/** El token viaja como header `Authorization: Bearer` en mobile (no hay cookies de
 * navegador) — se lee de SecureStore en cada request. */
const client = createApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: () => getStoredToken(),
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
