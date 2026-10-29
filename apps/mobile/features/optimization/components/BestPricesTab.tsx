import type { OptimizationRunResponse, StoreRankingEntryResponse } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { StoreBadge } from "@/components/stores/StoreBadge";
import { makeStyles } from "@/lib/theme";
import { blocksFromRoute, money } from "../helpers";

interface BestPricesTabProps {
  bestPrices: OptimizationRunResponse["bestPrices"];
  ranking: StoreRankingEntryResponse[];
}

/** Pestaña "Mejores precios": dónde está más barato cada producto y los mejores lugares para comprar todo junto. */
export function BestPricesTab({ bestPrices, ranking }: BestPricesTabProps) {
  const styles = useStyles();

  return (
    <>
      <Text style={styles.intro}>Dónde está más barato cada cosa de tu lista. Precio por unidad, sin promos.</Text>

      {bestPrices.map((entry) => (
        <View key={entry.productId} style={styles.priceCard}>
          <View style={styles.priceHead}>
            <Text style={styles.name} numberOfLines={2}>
              {entry.productName}
            </Text>
            {entry.quantity > 1 ? <Text style={styles.meta}>x{entry.quantity}</Text> : null}
          </View>

          {entry.offers.length === 0 ? (
            <Text style={styles.warning}>Ningún comercio cercano lo tiene con precio vigente.</Text>
          ) : (
            entry.offers.map((offer, index) => (
              <View key={offer.storeBranchId} style={styles.offerRow}>
                <View style={[styles.badge, index === 0 ? styles.badgeBest : null]}>
                  <Text style={[styles.badgeText, index === 0 ? styles.badgeTextBest : null]}>{index === 0 ? "Más barato" : index + 1}</Text>
                </View>
                <StoreBadge storeName={offer.storeName} size={30} />
                <View style={styles.flex}>
                  <Text style={styles.offerStore} numberOfLines={1}>
                    {offer.storeName} · {offer.branchName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {blocksFromRoute(offer.distanceFromRouteMeters)}
                  </Text>
                </View>
                <Text style={styles.offerPrice}>{money(offer.price)}</Text>
              </View>
            ))
          )}
        </View>
      ))}

      {ranking.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Si querés comprar todo en un solo lugar</Text>
          {ranking.slice(0, 3).map((entry, index) => (
            <View key={entry.storeBranchId} style={styles.rankRow}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
              <StoreBadge storeName={entry.storeName} size={34} />
              <View style={styles.flex}>
                <Text style={styles.name}>{entry.storeName}</Text>
                <Text style={styles.meta}>
                  {blocksFromRoute(entry.distanceFromRouteMeters)}
                  {entry.missingCount > 0 ? ` · le faltan ${entry.missingCount}` : ""}
                </Text>
              </View>
              <Text style={styles.total}>{money(entry.totalCost)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    intro: { fontFamily: typography.body.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    warning: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.state.warning },
    priceCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    priceHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    offerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 },
    badge: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.full, backgroundColor: colors.surface.input, alignItems: "center" },
    badgeBest: { backgroundColor: colors.saving.lime },
    badgeText: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary },
    badgeTextBest: { color: colors.text.onLime },
    offerStore: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    offerPrice: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    section: { gap: spacing.sm, marginTop: spacing.sm },
    sectionTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    rankRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    rankNumber: { width: 22, fontFamily: typography.heroTitle.fontFamily, fontSize: 18, color: colors.text.secondary, textAlign: "center" },
    total: { fontFamily: typography.heroTitle.fontFamily, fontSize: 20, color: colors.text.primary },
  }),
);
