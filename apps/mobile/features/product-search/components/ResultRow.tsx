import type { ProductSearchResult } from "@depaso/validation";
import { ActivityIndicator, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { useColors } from "@/lib/theme";
import { describeProduct } from "../helpers";
import { useStyles } from "../styles";

interface ResultRowProps {
  product: ProductSearchResult;
  /** id de la variante que se está agregando ahora (para mostrar el loader) */
  addingId: string | null;
  onAdd: () => void;
}

/** Un resultado de la búsqueda, con su botón "Sumar". */
export function ResultRow({ product, addingId, onAdd }: ResultRowProps) {
  const colors = useColors();
  const styles = useStyles();
  const meta = describeProduct(product);

  return (
    <AnimatedPressable
      accessibilityLabel={`Agregar ${product.name}${product.brandName ? `, ${product.brandName}` : ""}`}
      haptic={false}
      onPress={onAdd}
      style={styles.row}
    >
      <ProductThumb imageUrl={product.imageUrl} name={product.name} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={2}>
          {product.name}
        </Text>
        {meta ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {addingId === product.variants[0]?.id ? (
        <ActivityIndicator size="small" color={colors.text.primary} />
      ) : (
        <Text style={[styles.addLabel, addingId ? styles.addDisabled : null]}>Sumar</Text>
      )}
    </AnimatedPressable>
  );
}
