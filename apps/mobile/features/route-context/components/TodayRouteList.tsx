import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface TodayRouteListProps {
  waypoints: TodayWaypoint[];
  onRemove: (key: string) => void;
}

/** Las paradas que se van sumando al recorrido de hoy, numeradas, con una X para quitarlas. */
export function TodayRouteList({ waypoints, onRemove }: TodayRouteListProps) {
  const colors = useColors();
  const styles = useStyles();
  if (waypoints.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Tu ruta de hoy</Text>
      <View style={styles.placesList}>
        {waypoints.map((w, i) => (
          <View key={w.key} style={styles.waypointRow}>
            <Text style={styles.waypointNumber}>{i + 1}</Text>
            <Text style={styles.placeEmoji}>{w.emoji}</Text>
            <View style={styles.placeText}>
              <Text style={styles.placeName}>{w.name}</Text>
              <Text style={styles.placeAddress} numberOfLines={1}>
                {w.address}
              </Text>
            </View>
            <AnimatedPressable
              accessibilityLabel={`Quitar ${w.name} de la ruta de hoy`}
              haptic={false}
              onPress={() => onRemove(w.key)}
              style={styles.removeWaypointButton}
            >
              <Ionicons name="close" size={16} color={colors.text.secondary} />
            </AnimatedPressable>
          </View>
        ))}
      </View>
    </>
  );
}
