import { Ionicons } from "@expo/vector-icons";
import type { OptimizationPlanResponse } from "@depaso/validation";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useColors } from "@/lib/theme";
import { formatBlocks, money } from "../helpers";
import { useStyles } from "../styles";

type PlanStop = OptimizationPlanResponse["stops"][number];

interface PlanCardProps {
  plan: OptimizationPlanResponse;
  /** paradas de compra ya ordenadas a lo largo de la ruta */
  stops: PlanStop[];
  selectedId: string | null;
  /** si hay una línea del plan, la punteada es el recorrido original */
  hasPlanLine: boolean;
  onSelectStop: (branchId: string) => void;
}

/** "Tu compra de paso": total, ahorro, desvío y las paradas de compra con lo que se lleva en cada una. */
export function PlanCard({ plan, stops, selectedId, hasPlanLine, onSelectStop }: PlanCardProps) {
  const s = useStyles();
  const colors = useColors();
  const { start } = usePurchase();

  return (
    <View style={s.planCard}>
      <Text style={s.planEyebrow}>TU COMPRA DE PASO</Text>
      <Text style={s.planTitle}>
        {money(plan.totalProductCost)}
        {plan.estimatedSavings > 0 ? ` · ahorrás ${money(plan.estimatedSavings)}` : ""}
      </Text>
      <Text style={s.address}>
        {plan.numberOfStops} {plan.numberOfStops === 1 ? "parada" : "paradas"} de compra · te desviás{" "}
        {Math.max(1, Math.ceil(plan.additionalTimeSeconds / 60))} min
        {hasPlanLine ? " (la línea punteada es tu recorrido original)" : ""}
      </Text>

      {stops.map((stop, index) => {
        const subtotal = stop.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        return (
          <AnimatedPressable
            key={stop.storeBranchId}
            accessibilityLabel={`Parada de compra ${index + 1}: ${stop.storeName}`}
            haptic={false}
            onPress={() => onSelectStop(stop.storeBranchId)}
            style={[s.buyStop, stop.storeBranchId === selectedId ? s.storeRowSelected : null]}
          >
            <View style={s.buyHead}>
              <View style={s.storeIcon}>
                <Ionicons name="cart-outline" size={20} color={colors.text.onNavy} />
              </View>
              <View style={s.storeText}>
                <Text style={s.storeName}>{stop.storeName}</Text>
                <Text style={s.address} numberOfLines={1}>
                  {stop.address ?? stop.branchName}
                </Text>
                {stop.distanceFromRouteMeters !== undefined ? (
                  <Text style={s.detourStrong}>
                    {formatBlocks(stop.distanceFromRouteMeters)}
                    {stop.detourSeconds ? ` · +${Math.max(1, Math.round(stop.detourSeconds / 60))} min` : ""}
                  </Text>
                ) : null}
              </View>
              <Text style={s.buyTotal}>{money(subtotal)}</Text>
            </View>
            <Text style={s.buyItems}>{stop.items.map((item) => `${item.quantity} × ${item.productName}`).join(" · ")}</Text>
          </AnimatedPressable>
        );
      })}

      <View style={s.planActions}>
        <AnimatedPressable
          accessibilityLabel="Empezar compra"
          onPress={() => {
            start(plan);
            router.push("/purchase");
          }}
          style={s.selectedAction}
        >
          <Text style={s.selectedActionText}>Empezar compra</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Recalcular compra de paso"
          haptic={false}
          onPress={() => router.push("/optimization")}
          style={s.secondaryAction}
        >
          <Text style={s.secondaryActionText}>Recalcular</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
