import type { Ionicons } from "@expo/vector-icons";
import { createContext, useContext } from "react";
import type { ComponentProps } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { NotificationLayout } from "@/lib/notifications/geometry";

export type NotificationIcon = ComponentProps<typeof Ionicons>["name"];

export interface AppNotification {
  title: string;
  message?: string;
  icon?: NotificationIcon;
  /** Color del título y del ícono (hex `#RRGGBB`). */
  accent?: string;
  /** ms visible; `null` la deja hasta que se cierre a mano. */
  duration?: number | null;
  onPress?: () => void;
}

export interface DynamicNotificationsContextValue {
  trigger: (notification: AppNotification) => void;
  dismiss: () => void;
  notification: AppNotification | null;
  isVisible: boolean;
  layout: NotificationLayout;
  /** Sin goteo ni morph: sólo un fundido (preferencia "reducir movimiento"). */
  simple: boolean;
  drop: SharedValue<number>;
  expand: SharedValue<number>;
  reveal: SharedValue<number>;
  tint: SharedValue<number>;
  dragY: SharedValue<number>;
}

export const DynamicNotificationsContext = createContext<DynamicNotificationsContextValue | null>(null);

export function useDynamicNotifications(): DynamicNotificationsContextValue {
  const ctx = useContext(DynamicNotificationsContext);
  if (!ctx) throw new Error("useDynamicNotifications debe usarse dentro de <DynamicNotifications>");
  return ctx;
}
