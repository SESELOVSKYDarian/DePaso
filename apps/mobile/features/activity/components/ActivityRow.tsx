import type { CommunityFeedItem, CommunityFeedScope } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { StoreBadge } from "@/components/stores/StoreBadge";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles } from "@/lib/theme";

/** Precio en pesos sin decimales, con separador de miles argentino. */
function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

/** Un precio reportado: logo del comercio, producto, dónde y cuándo se vio, y cuánto costaba. */
export function ActivityRow({ item, scope }: { item: CommunityFeedItem; scope: CommunityFeedScope }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <StoreBadge storeName={item.storeName} size={40} />
      <View style={styles.text}>
        <Text style={styles.product} numberOfLines={2}>
          {item.productName}
          {item.sizeLabel ? ` · ${item.sizeLabel}` : ""}
        </Text>
        <Text style={styles.store} numberOfLines={1}>
          {item.storeName} · {item.branchName}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {item.isMine && scope === "community" ? "Vos · " : ""}
          {formatRelativeTime(item.createdAt)}
          {item.requiresPromotion ? ` · Con promo${item.promotionNote ? `: ${item.promotionNote}` : ""}` : ""}
          {item.status === "HIDDEN" ? " · En revisión" : ""}
        </Text>
      </View>
      <Text style={styles.price}>{formatPrice(item.reportedPrice)}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
    text: { flex: 1, gap: 1 },
    product: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, lineHeight: 20, color: colors.text.primary },
    store: { fontFamily: typography.subtitle.fontFamily, fontSize: 13, color: colors.text.secondary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
    price: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
  }),
);
