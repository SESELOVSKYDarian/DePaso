import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface RouteFooterProps {
  waypoints: TodayWaypoint[];
  onDone: () => void;
}

/** Pie de la pantalla: resumen de la ruta (para confirmarla) o "Listo" deshabilitado si no hay paradas. */
export function RouteFooter({ waypoints, onDone }: RouteFooterProps) {
  const colors = useColors();
  const styles = useStyles();

  return (
    <View style={styles.footer}>
      {waypoints.length > 0 ? (
        <AnimatedPressable accessibilityLabel="Confirmar recorrido de hoy" onPress={onDone} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TU RUTA DE HOY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRoute} numberOfLines={1}>
              {waypoints.map((w) => w.name).join("  →  ")}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.onNavy} />
          </View>
          <Text style={styles.summaryMeta}>
            {waypoints.length} {waypoints.length === 1 ? "parada" : "paradas"}
          </Text>
        </AnimatedPressable>
      ) : (
        <Button label="Listo" onPress={onDone} disabled />
      )}
    </View>
  );
}
