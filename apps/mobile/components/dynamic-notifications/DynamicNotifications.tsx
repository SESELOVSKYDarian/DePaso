import { useMemo, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getLayout } from "@/lib/notifications/geometry";
import { Card } from "./Card";
import { DynamicNotificationsContext } from "./context";
import { Gooey } from "./Gooey";
import { useNotificationTimeline } from "./useNotificationTimeline";

interface DynamicNotificationsProps {
  children: ReactNode;
  /** ms que dura cada notificación (por defecto 3200). `null` = hasta cerrarla a mano. */
  duration?: number | null;
}

/**
 * Notificaciones in-app con la forma de una "Dynamic Island": una gota cae desde el borde
 * superior y se abre en tarjeta. Basado en expo-dynamic-notifications (rit3zh, MIT).
 * Requiere `GestureHandlerRootView` y `SafeAreaProvider` por encima.
 */
export function DynamicNotifications({ children, duration }: DynamicNotificationsProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = useMemo(() => getLayout(width, insets.top), [width, insets.top]);
  const timeline = useNotificationTimeline(duration);

  const { drop, expand, reveal, tint, dragY, notification, isVisible, trigger, dismiss, simple } = timeline;
  const value = useMemo(
    () => ({ drop, expand, reveal, tint, dragY, notification, isVisible, trigger, dismiss, simple, layout }),
    [drop, expand, reveal, tint, dragY, notification, isVisible, trigger, dismiss, simple, layout],
  );

  return (
    <DynamicNotificationsContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <View pointerEvents="box-none" style={[styles.overlay, { height: layout.canvasHeight }]}>
          {notification ? <Gooey /> : null}
          <Card />
        </View>
      </View>
    </DynamicNotificationsContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // zIndex + elevation: por encima de pantallas con sombra (en Android `elevation` gana al orden).
  overlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000, elevation: 1000 },
});
