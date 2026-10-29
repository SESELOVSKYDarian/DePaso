import { StoreBadge } from "@/components/stores/StoreBadge";
import type { HomePromo } from "@depaso/validation";
import { Text, View } from "react-native";
import { useStyles } from "../styles";

/** "Ofertas de hoy": promos de bancos y billeteras que rigen hoy, primero las de tus medios de pago. */
export function PromosToday({ promos }: { promos: HomePromo[] }) {
  const styles = useStyles();
  if (promos.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Ofertas de hoy
      </Text>
      <View style={styles.card}>
        {promos.map((promo, index) => (
          <View key={promo.id} style={[styles.row, index > 0 ? styles.rowDivider : null]}>
            <StoreBadge storeName={promo.retailer} size={36} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {promo.retailer}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {promo.label}
              </Text>
            </View>
            {promo.mine ? <Text style={styles.mineTag}>Tuya</Text> : null}
          </View>
        ))}
      </View>
      <Text style={styles.footnote}>Promos informadas por la fuente: confirmá condiciones y tope en el comercio.</Text>
    </View>
  );
}
