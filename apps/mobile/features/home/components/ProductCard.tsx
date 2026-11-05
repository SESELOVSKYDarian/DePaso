import { Ionicons } from "@expo/vector-icons";
import type { HomeProduct } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { StoreBadge } from "@/components/stores/StoreBadge";
import { makeStyles, useColors } from "@/lib/theme";
import { money } from "../helpers";

interface ProductCardProps {
  product: HomeProduct;
  /** Muestra el chip "-X%" de ahorro (para la tira de baratos). */
  showSaving: boolean;
  /** Versión grande, para pantallas de computadora. */
  large: boolean;
  onAdd: (product: HomeProduct) => void;
}

/** Una tarjeta de producto sugerido: foto, nombre, comercio, precio y el "+" para sumarlo a la lista. */
export function ProductCard({ product, showSaving, large, onAdd }: ProductCardProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.card, large ? styles.cardLarge : null]}>
      <View style={styles.photoRow}>
        <ProductThumb imageUrl={product.imageUrl} name={product.name} size={large ? 112 : 84} />
        {showSaving && product.savingPercent >= 5 ? (
          <View style={styles.savingChip}>
            <Text style={styles.savingChipText}>-{Math.round(product.savingPercent)}%</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, large ? styles.nameLarge : null]} numberOfLines={2}>
        {product.name}
      </Text>
      <View style={styles.storeRow}>
        <StoreBadge storeName={product.storeName} size={18} />
        <Text style={styles.store} numberOfLines={1}>
          {product.storeName}
        </Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={[styles.price, large ? styles.priceLarge : null]}>{money(product.price)}</Text>
        <AnimatedPressable accessibilityLabel={`Sumar ${product.name} a mi lista`} haptic={false} onPress={() => onAdd(product)} style={styles.add}>
          <Ionicons name="add" size={22} color={colors.text.onNavy} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: { width: 164, gap: spacing.xs, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    cardLarge: { width: 224, gap: spacing.sm, padding: spacing.lg, borderRadius: 28 },
    photoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, minHeight: 36 },
    nameLarge: { fontSize: 16, lineHeight: 22, minHeight: 44 },
    storeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    store: { flex: 1, fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary },
    priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
    price: { fontFamily: typography.screenTitle.fontFamily, fontSize: 18, color: colors.text.primary },
    priceLarge: { fontSize: 22 },
    // chip verde de ahorro, como en el diseño
    savingChip: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radii.full, backgroundColor: colors.tint.green.bg, borderWidth: 1, borderColor: colors.tint.green.border },
    savingChipText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 12, color: colors.state.successStrong },
    add: { width: 44, height: 44, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand.navy },
  }),
);