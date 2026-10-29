import { Ionicons } from "@expo/vector-icons";
import type { AnnouncementResponse } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";

/** Una novedad del equipo: ícono, título, mensaje y hace cuánto se publicó. */
export function AnnouncementRow({ item }: { item: AnnouncementResponse }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name="megaphone-outline" size={20} color={colors.brand.route} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.meta}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
    icon: { width: 40, height: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint.blue.bg },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, lineHeight: 20, color: colors.text.primary },
    body: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
  }),
);
