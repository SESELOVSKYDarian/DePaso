import { StoreBadge } from "@/components/stores/StoreBadge";
import type { OptimizationPlanResponse } from "@depaso/validation";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { formatBlocks, money } from "../helpers";
import { useStyles } from "../styles";

type PlanStop = OptimizationPlanResponse["stops"][number];

interface PlanCardProps {
  /** paradas de compra ya ordenadas a lo largo de la ruta */
  stops: PlanStop[];
  selectedId: string | null;
  /** si hay una línea del plan, la punteada es el recorrido original */
  hasPlanLine: boolean;
  onSelectStop: (branchId: string) => void;
}

/** "Dónde parar": cada parada de compra con lo que se lleva en ella. El total y el botón van en la cabecera de la hoja. */
export function PlanCard({ stops, selectedId, hasPlanLine, onSelectStop }: PlanCardProps) {
  const s = useStyles();

  return (
    <View style={s.planCard}>
      <Text style={s.planEyebrow}>DÓNDE PARAR</Text>
      {hasPlanLine ? <Text style={s.address}>La línea punteada del mapa es tu recorrido original.</Text> : null}

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
              <StoreBadge storeName={stop.storeName} size={40} />
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

      <AnimatedPressable
        accessibilityLabel="Recalcular compra de paso"
        haptic={false}
        onPress={() => router.push("/optimization")}
        style={s.secondaryAction}
      >
        <Text style={s.secondaryActionText}>Recalcular</Text>
      </AnimatedPressable>
    </View>
  );
}
