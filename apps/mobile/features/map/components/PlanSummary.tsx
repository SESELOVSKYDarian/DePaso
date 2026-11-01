import type { OptimizationPlanResponse } from "@depaso/validation";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { makeStyles } from "@/lib/theme";
import { money } from "../helpers";
import { PlanTabs } from "./PlanTabs";

interface PlanSummaryProps {
  plan: OptimizationPlanResponse;
  plans: OptimizationPlanResponse[];
  onSelectPlan: (plan: OptimizationPlanResponse) => void;
  /** abre la hoja del todo para ver las paradas y los comercios */
  onSeeAll: () => void;
}

/**
 * Cabecera de la hoja cuando hay una compra calculada: lo primero que se ve sin deslizar.
 * Las tres opciones (sin desvíos, intermedio, económico), cuánto cuesta, cuánto se ahorra,
 * cuánto se desvía y el botón para empezar.
 */
export function PlanSummary({ plan, plans, onSelectPlan, onSeeAll }: PlanSummaryProps) {
  const s = useStyles();
  const { start } = usePurchase();
  const minutes = Math.max(1, Math.ceil(plan.additionalTimeSeconds / 60));

  return (
    <View style={s.box}>
      <View style={s.topRow}>
        <Text style={s.eyebrow}>TU COMPRA DE PASO</Text>
        <AnimatedPressable accessibilityLabel="Ver todo el detalle de la compra" haptic={false} onPress={onSeeAll}>
          <Text style={s.link}>Ver detalle</Text>
        </AnimatedPressable>
      </View>

      {plans.length > 1 ? <PlanTabs plans={plans} selectedLabel={plan.label} onSelect={onSelectPlan} /> : null}

      <View style={s.priceRow}>
        <Text style={s.price}>{money(plan.totalProductCost)}</Text>
        {plan.estimatedSavings > 0 ? (
          <View style={s.saving}>
            <Text style={s.savingText}>Ahorrás {money(plan.estimatedSavings)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.meta}>
        {plan.numberOfStops} {plan.numberOfStops === 1 ? "parada" : "paradas"} de compra · te desviás {minutes} min
      </Text>

      <AnimatedPressable
        accessibilityLabel="Empezar compra"
        onPress={() => {
          start(plan);
          router.push("/purchase");
        }}
        style={s.start}
      >
        <Text style={s.startText}>Empezar compra</Text>
      </AnimatedPressable>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    box: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 12, letterSpacing: 1.2, color: colors.brand.accentDark },
    link: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.brand.route },
    priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
    price: { fontFamily: typography.heroTitle.fontFamily, fontSize: 30, lineHeight: 36, color: colors.text.primary },
    saving: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radii.full, backgroundColor: colors.saving.lime },
    savingText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.onLime },
    meta: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, marginTop: -spacing.xs },
    start: {
      minHeight: 50,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    startText: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 16, color: colors.text.onNavy },
  }),
);
