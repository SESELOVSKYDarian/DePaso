import { Ionicons } from "@expo/vector-icons";
import type { HomePriceChange } from "@depaso/validation";
import { Text, View } from "react-native";
import { useColors } from "@/lib/theme";
import { money } from "../helpers";
import { useStyles } from "../styles";

/** "Cambios en tu lista": qué subió o bajó de precio en los últimos días. */
export function PriceChanges({ changes }: { changes: HomePriceChange[] }) {
  const styles = useStyles();
  const colors = useColors();
  if (changes.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Cambios en tu lista
      </Text>
      <View style={styles.card}>
        {changes.map((change, index) => {
          const down = change.changePercent < 0;
          const color = down ? colors.state.successStrong : colors.state.errorStrong;
          return (
            <View key={change.productId} style={[styles.row, index > 0 ? styles.rowDivider : null]}>
              <Ionicons name={down ? "trending-down" : "trending-up"} size={22} color={color} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {change.productName}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {down ? "Bajó" : "Subió"} en {change.storeName}: {money(change.previousPrice)} → {money(change.currentPrice)}
                </Text>
              </View>
              <Text style={[styles.badge, { color }]}>
                {down ? "" : "+"}
                {change.changePercent.toLocaleString("es-AR")}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
