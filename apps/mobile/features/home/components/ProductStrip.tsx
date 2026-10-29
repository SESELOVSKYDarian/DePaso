import { Ionicons } from "@expo/vector-icons";
import type { HomeProduct } from "@depaso/validation";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Skeleton } from "@/components/common/Skeleton";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { makeStyles, useColors } from "@/lib/theme";
import { money } from "../helpers";

interface ProductStripProps {
  title: string;
  subtitle: string;
  /** `null` mientras se cargan; con la lista vacía la tira no se muestra. */
  products: HomeProduct[] | null;
  /** Muestra "Ahorrás X%" (para la tira de baratos). */
  showSaving?: boolean;
  /** Se llama al tocar el "+" de un producto. */
  onAdd: (product: HomeProduct) => void;
}

const SKELETONS = [0, 1, 2];

/** Tira horizontal de productos sugeridos (baratos hoy o recomendados), con un botón para sumarlos a la lista. */
export function ProductStrip({ title, subtitle, products, showSaving = false, onAdd }: ProductStripProps) {
  const styles = useStyles();
  const colors = useColors();
  if (products !== null && products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {products === null
          ? SKELETONS.map((index) => <Skeleton key={index} width={156} height={190} borderRadius={radii.lg} />)
          : products.map((product) => (
              <View key={product.productId} style={styles.card}>
                <ProductThumb imageUrl={product.imageUrl} name={product.name} size={64} />
                <Text style={styles.name} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.store} numberOfLines={1}>
                  {product.storeName}
                </Text>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.price}>{money(product.price)}</Text>
                    {showSaving && product.savingPercent >= 5 ? <Text style={styles.saving}>Ahorrás {product.savingPercent}%</Text> : null}
                  </View>
                  <AnimatedPressable
                    accessibilityLabel={`Sumar ${product.name} a mi lista`}
                    haptic={false}
                    onPress={() => onAdd(product)}
                    style={styles.add}
                  >
                    <Ionicons name="add" size={20} color={colors.text.onNavy} />
                  </AnimatedPressable>
                </View>
              </View>
            ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    title: { fontFamily: typography.screenTitle.fontFamily, fontSize: 20, color: colors.text.primary },
    subtitle: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, marginTop: 2 },
    row: { gap: spacing.md, paddingRight: spacing.lg },
    card: {
      width: 156,
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, minHeight: 36 },
    store: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary },
    priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.xs },
    price: { fontFamily: typography.screenTitle.fontFamily, fontSize: 18, color: colors.text.primary },
    saving: { fontFamily: typography.itemTitle.fontFamily, fontSize: 12, color: colors.state.successStrong },
    add: {
      width: 34,
      height: 34,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.navy,
    },
  }),
);
