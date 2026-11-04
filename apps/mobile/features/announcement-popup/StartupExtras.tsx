import type { AnnouncementPopup as PopupData } from "@depaso/validation";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import { Dialog } from "@/components/common/Dialog";
import { activityClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { getStoredValue, setStoredValue } from "@/lib/auth/secureStore";
import {
  configureForegroundNotifications,
  getPermissionState,
  markAskedAboutNotifications,
  registerPushToken,
  requestPermission,
} from "@/lib/notifications/push";
import { AnnouncementPopup } from "./AnnouncementPopup";

const POPUP_SEEN_KEY = "depaso_popup_seen";
// cada cuánto se le vuelve a ofrecer activar los avisos si sigue sin tenerlos (12 horas)
const LAST_ASKED_KEY = "depaso_notify_last_asked";
const REMIND_EVERY_MS = 12 * 60 * 60 * 1000;


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
  // si el sistema ya los bloqueó, el cartel del permiso no sale más: se lo manda a los ajustes
  const [blocked, setBlocked] = useState(false);
  const started = useRef(false);
  const checking = useRef(false);
  const popupOpen = useRef(false);
  const { user } = useAuth();
  // el anuncio visto se recuerda por cuenta: otra cuenta en el mismo celular lo ve igual
  const seenKey = `${POPUP_SEEN_KEY}_${user?.id ?? "anon"}`;
  const lastResponse = Platform.OS === "web" ? null : Notifications.useLastNotificationResponse();

  // al tocar un aviso del celular se abre lo que corresponde
  useEffect(() => {
    if (!lastResponse) return;
    openFromNotification(lastResponse.notification.request.content.data as Record<string, unknown> | undefined);
  }, [lastResponse]);

  // ¿hay que ofrecer los avisos? Si no los tiene, se le recuerda cada tanto (siempre con "Ahora no")
  const askIfNeeded = async () => {
    const state = await getPermissionState();
    if (state === "granted") {
      void registerPushToken();
      return;
    }
    if (state === "unsupported") return;
    const last = Number(await getStoredValue(LAST_ASKED_KEY)) || 0;
    if (Date.now() - last < REMIND_EVERY_MS) return;
    setBlocked(state === "denied");
    setAsking(true);
  };

  // Busca el anuncio vigente y, si no hay uno nuevo para mostrar, ofrece los avisos.
  // Se hace al entrar y cada vez que la app vuelve a primer plano (un anuncio publicado mientras
  // la app estaba abierta o en segundo plano también aparece).
  const checkStartup = async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const [{ announcement }, seen] = await Promise.all([activityClient.popup(), getStoredValue(seenKey)]);
      if (announcement && announcement.id !== seen) {
        setPopup(announcement);
        return; // lo que sigue arranca cuando se cierre la ventana
      }
    } catch {
      // sin conexión o sin anuncio: se sigue igual
    } finally {
      checking.current = false;
    }
    await askIfNeeded();
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void checkStartup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !popupOpen.current && !asking) void checkStartup();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asking, seenKey]);

  popupOpen.current = popup !== null;

  const closePopup = () => {
    if (popup) void setStoredValue(seenKey, popup.id);
    setPopup(null);
    void askIfNeeded();
  };

  const accept = async () => {
    setAsking(false);
    void setStoredValue(LAST_ASKED_KEY, String(Date.now()));
    if (blocked) {
      void Linking.openSettings();
      return;
    }
    const state = await requestPermission();
    if (state === "granted") void registerPushToken();
  };

  const decline = () => {
    setAsking(false);
    void setStoredValue(LAST_ASKED_KEY, String(Date.now()));
    void markAskedAboutNotifications();
  };

  return (
    <>
      <AnnouncementPopup announcement={popup} onClose={closePopup} />
      <Dialog
        visible={asking}
        title="¿Querés recibir avisos?"
        description={
          blocked
            ? "Los avisos están bloqueados. Activalos desde los ajustes del celular para enterarte de ofertas, listas compartidas y comercios cerca tuyo."
            : "Te avisamos en el celular cuando baja algo de tus listas, hay una oferta cerca, te comparten una lista o publicamos una novedad. Podés elegir cuáles en Perfil › Avisos del celular."
        }
        confirmLabel={blocked ? "Abrir ajustes" : "Activar avisos"}
        cancelLabel="Ahora no"
        onConfirm={() => void accept()}
        onCancel={decline}
      />
    </>
  );
}
