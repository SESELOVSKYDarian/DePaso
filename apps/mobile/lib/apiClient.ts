import {
  createApiClient,
  createAuthClient,
  createConsentClient,
  createPlacesClient,
  createRouteContextClient,
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
