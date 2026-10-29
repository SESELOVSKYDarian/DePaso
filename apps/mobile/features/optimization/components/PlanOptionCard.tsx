import { Ionicons } from "@expo/vector-icons";
import type { OptimizationPlanResponse } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";
import { useCountUp } from "@/lib/useCountUp";
import { PLAN_LABELS, extraDistance, money } from "../helpers";

interface PlanOptionCardProps {
  plan: OptimizationPlanResponse;
  onStart: () => void;
  onMap: () => void;
}

/** Una de las tres opciones de compra: total, ahorro, desvío, promos aplicadas y qué le falta. */
export function PlanOptionCard({ plan, onStart, onMap }: PlanOptionCardProps) {
  const colors = useColors();
  const styles = useStyles();
  const meta = PLAN_LABELS[plan.label];
  const recommended = plan.label === "BALANCED";
  const animatedSavings = useCountUp(plan.estimatedSavings, 500);

  // Un plan que no consigue todo sale "más barato" porque no incluye esos productos: se aclara.
  const missingCount = plan.missingProductIds.length;
  const boughtCount = plan.stops.reduce((sum, stop) => sum + stop.items.length, 0);
  const costLabel = missingCount > 0 ? `Costo de ${boughtCount} de ${boughtCount + missingCount} productos` : "Costo de toda tu lista";

  return (
    <View style={[styles.card, recommended ? styles.recommended : null]}>
      <View style={styles.head}>
        <View style={[styles.icon, recommended ? styles.iconRecommended : null]} accessible={false}>
          <Ionicons name={meta.icon} size={21} color={colors.text.primary} />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleLine}>
            <Text style={styles.title}>{meta.title}</Text>
            {recommended ? <Text style={styles.tag}>RECOMENDADO</Text> : null}
          </View>
          <Text style={styles.meta}>{meta.subtitle}</Text>
        </View>
      </View>

      <View style={styles.costRow}>
        <View>
          <Text style={styles.meta}>{costLabel}</Text>
          <Text style={styles.cost}>{money(plan.totalProductCost)}</Text>
        </View>
        {plan.estimatedSavings > 0 ? (
          <View style={styles.savings}>
            <Text style={styles.savingsText}>Ahorrás {money(animatedSavings)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.meta}>
        {plan.numberOfStops} {plan.numberOfStops === 1 ? "comercio" : "comercios"}  ·  {extraDistance(plan.additionalDistanceMeters)}  ·{" "}
        {Math.ceil(plan.additionalTimeSeconds / 60)} min
      </Text>

      {plan.appliedPromos.map((promo) => (
        <View key={`${promo.retailer}-${promo.label}`} style={styles.promoBox}>
          <Text style={styles.promoTitle}>
            {promo.retailer}: {promo.label}
          </Text>
          <Text style={styles.promoText}>
            Descuento {money(promo.discountAmount)}. {promo.disclaimer}
          </Text>
        </View>
      ))}

      <Text style={styles.explanation}>{plan.explanation}</Text>

      {missingCount > 0 ? (
        <View style={styles.missingBox}>
          <Text style={styles.missingTitle}>
            {missingCount === 1 ? "Falta 1 producto" : `Faltan ${missingCount} productos`}: {plan.missingProductNames.join(", ")}
          </Text>
          <Text style={styles.missingText}>
            Ningún comercio a este nivel de desvío los tiene con precio vigente, por eso este total es más bajo: no los incluye. Vas a tener que comprarlos en otro lado.
          </Text>
        </View>
      ) : null}

      <AnimatedPressable accessibilityLabel={`Ver ${meta.title} en el mapa`} haptic={false} onPress={onMap} style={styles.action}>
        <Text style={styles.actionText}>Ver mi ruta en el mapa</Text>
        <Ionicons name="map-outline" size={17} color={colors.text.primary} accessible={false} />
      </AnimatedPressable>
      <AnimatedPressable accessibilityLabel={`Empezar compra con ${meta.title}`} onPress={onStart} style={styles.action}>
        <Text style={styles.actionText}>Empezar compra</Text>
        <Ionicons name="arrow-forward" size={17} color={colors.text.primary} accessible={false} />
      </AnimatedPressable>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    card: {
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    recommended: { borderColor: colors.saving.lime, borderWidth: 2 },
    head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    icon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.tint.blue.bg, alignItems: "center", justifyContent: "center" },
    iconRecommended: { backgroundColor: colors.surface.secondary },
    titleLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 17, color: colors.text.primary },
    tag: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 10,
      color: colors.text.onLime,
      backgroundColor: colors.saving.lime,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    costRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    cost: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, color: colors.text.primary },
    savings: { backgroundColor: colors.saving.lime, borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 6 },
    savingsText: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.onLime },
    promoBox: { backgroundColor: colors.brand.mint, borderRadius: radii.md, padding: spacing.sm, gap: 2 },
    promoTitle: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 13, color: colors.text.primary },
    promoText: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    explanation: { fontFamily: typography.body.fontFamily, fontSize: 13, lineHeight: 19, color: colors.text.primary },
    missingBox: { gap: 2, padding: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.state.warning },
    missingTitle: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 13, color: colors.state.warning },
    missingText: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
    action: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      paddingTop: spacing.sm,
    },
    actionText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
  }),
);
