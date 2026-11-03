import type { AnnouncementPopup as PopupData } from "@depaso/validation";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Dialog } from "@/components/common/Dialog";
import { activityClient } from "@/lib/apiClient";
import { getStoredValue, setStoredValue } from "@/lib/auth/secureStore";
import {
  configureForegroundNotifications,
  getPermissionState,
  markAskedAboutNotifications,
  registerPushToken,
  requestPermission,
  wasAskedAboutNotifications,
} from "@/lib/notifications/push";
import { AnnouncementPopup } from "./AnnouncementPopup";

const POPUP_SEEN_KEY = "depaso_popup_seen";

configureForegroundNotifications();

/** A qué pantalla lleva cada tipo de aviso al tocarlo. */
function openFromNotification(data: Record<string, unknown> | undefined): void {
  const type = data?.type;
  if (type === "list" && typeof data?.id === "string") router.push(`/lists/${data.id}`);
  else if (type === "announcement" || type === "offers") router.push("/(tabs)/activity");
  else if (type === "route") router.push("/map");
}

/**
 * Lo que pasa al abrir la app con la sesión iniciada, en orden y sin pisarse:
 * 1) el anuncio vigente, como ventana con cruz (una sola vez por anuncio);
 * 2) la pregunta de si quiere recibir avisos en el celular (una sola vez);
 * 3) registrar el celular para los avisos si ya dio permiso.
 * También lleva a la pantalla correcta cuando se toca un aviso del celular.
 */
export function StartupExtras() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [asking, setAsking] = useState(false);
  const started = useRef(false);
  const lastResponse = Platform.OS === "web" ? null : Notifications.useLastNotificationResponse();

  // al tocar un aviso del celular se abre lo que corresponde
  useEffect(() => {
    if (!lastResponse) return;
    openFromNotification(lastResponse.notification.request.content.data as Record<string, unknown> | undefined);
  }, [lastResponse]);

  // ¿hay que preguntar por los avisos? (solo si el sistema todavía no lo decidió y no se preguntó antes)
  const askIfNeeded = async () => {
    const [state, asked] = await Promise.all([getPermissionState(), wasAskedAboutNotifications()]);
    if (state === "granted") void registerPushToken();
    else if (state === "undetermined" && !asked) setAsking(true);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const [{ announcement }, seen] = await Promise.all([activityClient.popup(), getStoredValue(POPUP_SEEN_KEY)]);
        if (announcement && announcement.id !== seen) {
          setPopup(announcement);
          return; // lo que sigue arranca cuando se cierre la ventana
        }
      } catch {
        // sin conexión o sin anuncio: se sigue igual
      }
      await askIfNeeded();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closePopup = () => {
    if (popup) void setStoredValue(POPUP_SEEN_KEY, popup.id);
    setPopup(null);
    void askIfNeeded();
  };

  const accept = async () => {
    setAsking(false);
    const state = await requestPermission();
    if (state === "granted") void registerPushToken();
  };

  const decline = () => {
    setAsking(false);
    void markAskedAboutNotifications();
  };

  return (
    <>
      <AnnouncementPopup announcement={popup} onClose={closePopup} />
      <Dialog
        visible={asking}
        title="¿Querés recibir avisos?"
        description="Te avisamos en el celular cuando baja algo de tus listas, hay una oferta cerca, te comparten una lista o publicamos una novedad. Podés elegir cuáles en Perfil › Avisos del celular."
        confirmLabel="Activar avisos"
        cancelLabel="Ahora no"
        onConfirm={() => void accept()}
        onCancel={decline}
      />
    </>
  );
}
