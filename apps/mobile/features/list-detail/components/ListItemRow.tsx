import { Ionicons } from "@expo/vector-icons";
import type { ShoppingListResponse } from "@depaso/validation";
import { ActivityIndicator, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface ListItemRowProps {
  item: ShoppingListResponse["items"][number];
  /** `true` mientras se actualiza esta fila (se muestra un loader en la cantidad) */
  isBusy: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

/** Un producto de la lista: foto, nombre, cantidad con + y -, y el botón de quitar. */
export function ListItemRow({ item, isBusy, onQuantityChange, onRemove }: ListItemRowProps) {
  const colors = useColors();
  const styles = useStyles();

  return (
    // Sin animaciones de entrada/salida por fila: en una lista virtualizada, cuando entran
    // varias filas juntas (p. ej. después de armar la lista con IA) fallan en Android.
    <View style={styles.row}>
      <ProductThumb imageUrl={item.imageUrl} name={item.productName} size={44} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={2}>
          {item.productName}
        </Text>
        {item.brandName ? (
          <Text style={styles.rowNote} numberOfLines={1}>
            {item.brandName}
          </Text>
        ) : null}
        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
      </View>
      <View style={styles.quantityRow}>
        <AnimatedPressable
          accessibilityLabel={`Restar uno de ${item.productName}`}
          haptic={false}
          onPress={() => onQuantityChange(item.quantity - 1)}
          style={styles.stepperButton}
        >
          <Ionicons name="remove" size={18} color={colors.text.primary} />
        </AnimatedPressable>
        {isBusy ? (
          <ActivityIndicator size="small" color={colors.text.primary} style={styles.quantityLoader} />
        ) : (
          <Text style={styles.quantity}>{item.quantity}</Text>
        )}
        <AnimatedPressable
          accessibilityLabel={`Sumar uno de ${item.productName}`}
          haptic={false}
          onPress={() => onQuantityChange(item.quantity + 1)}
          style={styles.stepperButton}
        >
          <Ionicons name="add" size={18} color={colors.text.primary} />
        </AnimatedPressable>
      </View>
      <AnimatedPressable accessibilityLabel={`Quitar ${item.productName}`} haptic={false} onPress={onRemove} style={styles.removeButton}>
        <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
      </AnimatedPressable>
    </View>
  );
}
