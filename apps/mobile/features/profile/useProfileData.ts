import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { paymentsClient, preferencesClient } from "@/lib/apiClient";
import { useActivitySummary } from "@/lib/activity/useActivitySummary";
import { useAuth } from "@/lib/auth/AuthContext";

/** Los números y acciones que necesita el Perfil: preferencias, solicitudes pendientes y promos. */
export function useProfileData() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { show: showToast } = useToast();
  const [productPreferenceCount, setProductPreferenceCount] = useState(0);
  const { summary, refresh: refreshSummary } = useActivitySummary();

  // cuántos productos con preferencia de marca tiene
  useEffect(() => {
    if (!isAuthenticated) return;
    preferencesClient.products
      .list()
      .then(({ preferences }) => setProductPreferenceCount(preferences.length))
      .catch(() => setProductPreferenceCount(0));
  }, [isAuthenticated]);

  // Al volver a esta pestaña se refresca el rol (por si un admin aprobó la solicitud) y,
  // si es admin, el contador de solicitudes de comercio pendientes.
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      void refreshUser().catch(() => undefined);
      void refreshSummary();
    }, [isAuthenticated, refreshUser, refreshSummary]),
  );

  // solo para administradores: vuelve a bajar las promos de bancos y billeteras
  const syncPromos = () => {
    showToast("Actualizando promos de bancos y billeteras...", "info");
    paymentsClient
      .syncPromos()
      .then(({ accepted, discarded }) => showToast(`${accepted} promos válidas cargadas, ${discarded} descartadas.`, "success"))
      .catch(() => showToast("No pudimos actualizar las promos.", "error"));
  };

  return { productPreferenceCount, pendingMerchantRequests: summary.merchantRequests, pendingAdRequests: summary.adRequests, syncPromos };
}
