import { Ionicons } from "@expo/vector-icons";
import type { OptimizationPlanResponse } from "@depaso/validation";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { InfoButton } from "@/components/common/InfoButton";
import { PRICE_DISCLOSURE_NOTICE } from "@/lib/priceDisclosure";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { makeStyles, useColors } from "@/lib/theme";
import { PLAN_LABELS, PLAN_ORDER, UNAVAILABLE_TEXT } from "../helpers";
import { PlanOptionCard } from "./PlanOptionCard";

interface OptionsTabProps {
  plans: OptimizationPlanResponse[];
  hasPaymentMethods: boolean;
}

/** Pestaña "Opciones de compra": las tres formas de comprar y por qué falta alguna, si falta. */
export function OptionsTab({ plans, hasPaymentMethods }: OptionsTabProps) {
  const colors = useColors();
  const styles = useStyles();
  const { start, setRoutePlan } = usePurchase();
  const noPromos = plans.every((plan) => plan.appliedPromos.length === 0);
  const missingLabels = PLAN_ORDER.filter((label) => !plans.some((plan) => plan.label === label));

  // Si varias opciones dan lo mismo (mismos comercios y mismo costo) se muestra una sola vez.
  const planKey = (plan: OptimizationPlanResponse) =>
    `${Math.round(plan.totalProductCost)}|${plan.stops.map((stop) => stop.storeBranchId).sort().join(",")}`;
  const groups = new Map<string, OptimizationPlanResponse[]>();
  for (const plan of plans) groups.set(planKey(plan), [...(groups.get(planKey(plan)) ?? []), plan]);
  const shown = [...groups.values()].map((group) => group.find((plan) => plan.label === "BALANCED") ?? group[0]!);
  const merged = plans.length - shown.length;

  // Las aclaraciones van dentro del botón "i", no sueltas en la pantalla.
  const infoLines = [
    "De menos a más desvío. En cada una, lo más barato con las promos de tus medios de pago.",
    PRICE_DISCLOSURE_NOTICE,
    ...(merged > 0
      ? [
          shown.length === 1
            ? `Hoy las ${plans.length} opciones dan lo mismo: el mismo comercio es el más barato y el más cercano.`
            : "Las opciones que coinciden (mismos comercios y mismo costo) se muestran una sola vez.",
        ]
      : []),
    ...(!hasPaymentMethods || !noPromos ? [] : ["Sin promos de tus medios de pago, los precios van sin descuento."]),
  ];

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.intro}>Tres formas de comprar</Text>
        <InfoButton title="Sobre estas opciones" lines={infoLines} />
      </View>

      {!hasPaymentMethods ? (
        <AnimatedPressable
          accessibilityLabel="Cargar mis billeteras y tarjetas"
          haptic={false}
          onPress={() => router.push("/payment-methods")}
          style={styles.promoHint}
        >
          <Ionicons name="card-outline" size={20} color={colors.text.primary} />
          <View style={styles.flex}>
            <Text style={styles.hintTitle}>Sumá tus billeteras y tarjetas</Text>
            <Text style={styles.meta}>Así descontamos las promos que tenés (Cuenta DNI, Mercado Pago, MODO, Visa…).</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
        </AnimatedPressable>
      ) : noPromos ? (
        <Text style={styles.meta}>No encontramos promos de tus medios de pago.</Text>
      ) : null}

      {shown.map((plan) => (
        <PlanOptionCard
          key={plan.label}
          plan={plan}
          onStart={() => {
            start(plan);
            router.push("/purchase");
          }}
          onMap={() => {
            setRoutePlan(plan);
            router.navigate("/map");
          }}
        />
      ))}

      {missingLabels.map((label) => (
        <View key={label} style={styles.unavailable}>
          <Text style={styles.hintTitle}>{PLAN_LABELS[label].title}</Text>
          <Text style={styles.meta}>{UNAVAILABLE_TEXT[label]}</Text>
        </View>
      ))}
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    intro: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    hintTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    promoHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    unavailable: { gap: 2, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border.subtle },
  }),
);
