import { Ionicons } from "@expo/vector-icons";
import type { ActivityItem, ActivityItemType } from "@depaso/validation";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";

const ICONS: Record<ActivityItemType, keyof typeof Ionicons.glyphMap> = {
  LIST_SHARED: "people-outline",
  PRICE_DROP: "trending-down-outline",
  CHEAP_NEARBY: "pricetag-outline",
};

/** Un aviso propio: lista compartida, precio que bajó u oferta cerca. Las listas se abren al tocarlas. */
export function PersonalRow({ item }: { item: ActivityItem }) {
  const styles = useStyles();
  const colors = useColors();
  const openList = item.listId ? () => router.push({ pathname: "/lists/[id]", params: { id: item.listId! } }) : undefined;

  return (
    <AnimatedPressable
      accessibilityLabel={`${item.title}. ${item.detail}`}
      haptic={false}
      {...(openList ? { onPress: openList } : {})}
      style={styles.row}
    >
      <View style={styles.icon}>
        <Ionicons name={ICONS[item.type]} size={20} color={colors.brand.accentDark} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.detail}>{item.detail}</Text>
        {item.at ? <Text style={styles.meta}>{formatRelativeTime(item.at)}</Text> : null}
      </View>
      {openList ? <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} /> : null}
    </AnimatedPressable>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
    icon: { width: 40, height: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint.green.bg },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, lineHeight: 20, color: colors.text.primary },
    detail: { fontFamily: typography.body.fontFamily, fontSize: 13, lineHeight: 19, color: colors.text.secondary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
  }),
);
