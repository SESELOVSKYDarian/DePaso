import { Ionicons } from "@expo/vector-icons";
import type { NotificationSettings } from "@depaso/validation";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { NearbyAlertCard } from "./components/NearbyAlertCard";
import { useNotificationSettings } from "@/lib/notifications/useNotificationSettings";
import { makeStyles, useColors } from "@/lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const CATEGORIES: { key: keyof NotificationSettings; icon: IconName; title: string; text: string }[] = [
  { key: "news", icon: "megaphone-outline", title: "Novedades de DePaso", text: "Actualizaciones y anuncios del equipo." },
  { key: "offers", icon: "pricetag-outline", title: "Ofertas y bajas de precio", text: "Cuando baja algo de tus listas o hay una oferta cerca. Como mucho una por día." },
  { key: "lists", icon: "people-outline", title: "Listas compartidas", text: "Cuando alguien comparte una lista con vos." },
  { key: "routes", icon: "navigate-outline", title: "Cuando empiezo mi recorrido", text: "Un aviso con tus paradas al tocar Empezar compra." },
];

/** Avisos en el celular: el permiso del sistema y qué tipos de aviso quiere recibir la persona. */
export default function NotificationSettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const data = useNotificationSettings();
  const on = data.permission === "granted";

  return (
    <BackToTopScrollView contentContainerStyle={styles.container}>
      <View style={[styles.hero, on ? styles.heroOn : null]}>
        <View style={[styles.heroIcon, on ? styles.heroIconOn : null]}>
          <Ionicons name={on ? "notifications" : "notifications-off-outline"} size={26} color={on ? colors.text.onLime : colors.text.secondary} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{on ? "Avisos del celular activados" : "Avisos del celular apagados"}</Text>
          <Text style={styles.heroSub}>
            {on ? "Te llegan como cualquier notificación, aunque no tengas la app abierta." : "Activalos para enterarte de ofertas, novedades y listas compartidas sin abrir la app."}
          </Text>
        </View>
      </View>

      {!on ? (
        data.permission === "denied" ? (
          <Button label="Abrir ajustes del celular" onPress={data.openSystemSettings} />
        ) : (
          <Button label="Activar avisos" onPress={() => void data.enable()} />
        )
      ) : null}
      {data.message ? (
        <Text accessibilityRole="alert" style={styles.message}>
          {data.message}
        </Text>
      ) : null}

      <Text style={styles.section}>Qué avisos querés recibir</Text>
      {data.loading ? <ActivityIndicator color={colors.text.secondary} /> : null}
      <View style={styles.card}>
        {CATEGORIES.map((category, index) => (
          <View key={category.key} style={[styles.row, index > 0 ? styles.separated : null]}>
            <View style={styles.rowIcon}>
              <Ionicons name={category.icon} size={20} color={colors.brand.navy} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{category.title}</Text>
              <Text style={styles.rowSub}>{category.text}</Text>
            </View>
            <Switch
              accessibilityLabel={category.title}
              value={data.settings[category.key]}
              onValueChange={(value) => void data.toggle(category.key, value)}
              trackColor={{ true: colors.brand.navy, false: colors.border.strong }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </View>

      <Text style={styles.section}>Cuando estás cerca</Text>
      <NearbyAlertCard />

      <Text style={styles.footnote}>
        Los avisos de adentro de la app (el historial) siguen apareciendo siempre. Esto es solo para las notificaciones del celular.
      </Text>
    </BackToTopScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    heroOn: { borderColor: colors.saving.lime },
    heroIcon: { width: 52, height: 52, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.input },
    heroIconOn: { backgroundColor: colors.saving.lime },
    heroText: { flex: 1, gap: 2 },
    heroTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    heroSub: { fontFamily: typography.body.fontFamily, fontSize: 13, lineHeight: 19, color: colors.text.secondary },
    message: { fontFamily: typography.caption.fontFamily, fontSize: 13, lineHeight: 18, color: colors.state.errorStrong },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.sm },
    card: { borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
    separated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle },
    rowIcon: { width: 38, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint.blue.bg },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    rowSub: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
    footnote: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.tertiary },
  }),
);
