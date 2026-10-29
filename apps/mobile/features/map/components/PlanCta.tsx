import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

/** Invitación a armar la compra de paso (o a recalcularla si cambió el recorrido). */
export function PlanCta({ hasOldPlan }: { hasOldPlan: boolean }) {
  const s = useStyles();
  const colors = useColors();

  return (
    <AnimatedPressable accessibilityLabel="Armar mi compra de paso" onPress={() => router.push("/optimization")} style={s.planCta}>
      <Ionicons name="cart-outline" size={22} color={colors.text.primary} />
      <View style={s.storeText}>
        <Text style={s.storeName}>{hasOldPlan ? "Cambiaste tu recorrido: recalculá" : "Armá tu compra de paso"}</Text>
        <Text style={s.address}>
          {hasOldPlan
            ? "La ruta con tu parada de compra ya no coincide con la de hoy."
            : "Te decimos en qué comercio parar, el más barato de tu camino, y cuánto te desviás."}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
    </AnimatedPressable>
  );
}
