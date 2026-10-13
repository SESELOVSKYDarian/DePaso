import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { useNotificationInbox } from "@/components/Toast";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";

/** Historial de los avisos que mostró la app (los que aparecen arriba, como la isla dinámica). */
export default function NotificationsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { items, markAllRead, clear } = useNotificationInbox();

  // Entrar a la pantalla = verlas: se marcan como leídas al salir de la lista de pendientes.
  useEffect(() => {
    const timer = setTimeout(markAllRead, 800);
    return () => clearTimeout(timer);
  }, [markAllRead, items.length]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <EmptyState
          emoji="🔔"
          title="Todo tranquilo"
          description="Acá vas a ver los avisos que te mostramos: listas compartidas, precios reportados y más."
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {items.map((item, index) => {
          const tint =
            item.variant === "success"
              ? colors.state.successStrong
              : item.variant === "error"
                ? colors.state.errorStrong
                : colors.text.primary;
          return (
            <View key={item.id} style={[styles.row, index > 0 ? styles.separated : null]}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color={tint} />
              </View>
              <View style={styles.rowText}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                </View>
                {item.message ? (
                  <Text style={styles.message} numberOfLines={3}>
                    {item.message}
                  </Text>
                ) : null}
                <Text style={styles.time}>{formatRelativeTime(item.at)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <AnimatedPressable accessibilityLabel="Borrar todas las notificaciones" haptic={false} onPress={clear} style={styles.clear}>
        <Text style={styles.clearLabel}>Borrar todo</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    empty: { flex: 1, backgroundColor: colors.surface.base },
    container: {
      flexGrow: 1,
      backgroundColor: colors.surface.base,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md,
    },
    separated: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.subtle,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: colors.surface.input,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: { flex: 1, gap: 2 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    title: {
      flexShrink: 1,
      fontFamily: typography.itemTitle.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.brand.route,
    },
    message: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      lineHeight: 19,
      color: colors.text.secondary,
    },
    time: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    clear: {
      alignSelf: "center",
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    clearLabel: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
      textDecorationLine: "underline",
    },
  }),
);
