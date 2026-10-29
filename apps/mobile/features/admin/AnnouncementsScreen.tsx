import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";
import { useAnnouncements } from "./useAnnouncements";

/** Administración: publicar novedades que ven todos en Actividad, y ocultar o borrar las anteriores. */
export default function AnnouncementsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const data = useAnnouncements();

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Lo que publiques acá aparece en Actividad › Novedades de todos los usuarios.</Text>

      <FormField label="Título" value={data.title} onChangeText={data.setTitle} placeholder="Ej.: Nueva función de rutas guardadas" maxLength={120} />
      <FormField label="Mensaje" value={data.body} onChangeText={data.setBody} placeholder="Contá la novedad en pocas líneas" multiline maxLength={2000} error={data.error} />
      <Button label={data.publishing ? "Publicando…" : "Publicar novedad"} onPress={() => void data.publish()} loading={data.publishing} />

      <Text style={styles.section}>Publicadas</Text>
      {data.loading ? <ActivityIndicator color={colors.text.secondary} /> : null}
      {!data.loading && data.items.length === 0 ? <Text style={styles.empty}>Todavía no publicaste ninguna.</Text> : null}
      {data.items.map((item) => (
        <View key={item.id} style={[styles.card, item.active ? null : styles.cardHidden]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.meta}>
            {formatRelativeTime(item.createdAt)} · {item.active ? "Visible" : "Oculta"}
          </Text>
          <View style={styles.actions}>
            <AnimatedPressable accessibilityLabel={item.active ? "Ocultar novedad" : "Mostrar novedad"} haptic={false} onPress={() => void data.toggle(item)} style={styles.action}>
              <Ionicons name={item.active ? "eye-off-outline" : "eye-outline"} size={18} color={colors.text.primary} />
              <Text style={styles.actionText}>{item.active ? "Ocultar" : "Mostrar"}</Text>
            </AnimatedPressable>
            <AnimatedPressable accessibilityLabel="Borrar novedad" haptic={false} onPress={() => void data.remove(item)} style={styles.action}>
              <Ionicons name="trash-outline" size={18} color={colors.state.errorStrong} />
              <Text style={[styles.actionText, { color: colors.state.errorStrong }]}>Borrar</Text>
            </AnimatedPressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    intro: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.md },
    empty: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    card: { gap: 4, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    cardHidden: { opacity: 0.55 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    body: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
    actions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.xs },
    action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
    actionText: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary },
  }),
);
