import type { ReactNode } from "react";
import { ToastProvider } from "@/components/common/Toast";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { DetourProvider } from "@/lib/detour/DetourContext";
import { ListsProvider } from "@/lib/lists/ListsContext";
import { PlacesProvider } from "@/lib/places/PlacesContext";
import { PurchaseProvider } from "@/lib/purchase/PurchaseContext";
import { TodayRouteProvider } from "@/lib/routeContext/TodayRouteContext";

/**
 * Todos los contextos de la app, de afuera hacia adentro. El orden importa: el recorrido de hoy
 * necesita saber quién inició sesión, y la compra depende del recorrido.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PlacesProvider>
        <ListsProvider>
          <DetourProvider>
            <TodayRouteProvider>
              <PurchaseProvider>
                <ToastProvider>{children}</ToastProvider>
              </PurchaseProvider>
            </TodayRouteProvider>
          </DetourProvider>
        </ListsProvider>
      </PlacesProvider>
    </AuthProvider>
  );
}
