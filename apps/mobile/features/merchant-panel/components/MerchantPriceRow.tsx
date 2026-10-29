import { Ionicons } from "@expo/vector-icons";
import type { MerchantPriceResponse } from "@depaso/validation";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { useColors } from "@/lib/theme";
import { formatPrice } from "../helpers";
import { useStyles } from "../styles";

/** Un precio de la lista del comercio: foto, nombre, marca, tamaño y precio. Al tocarlo se edita. */
export function MerchantPriceRow({ item }: { item: MerchantPriceResponse }) {
  const colors = useColors();
  const styles = useStyles();
  const name = item.displayName ?? item.productName;
  // los precios que vienen de SEPA se invitan a confirmar
  const fromPublicSource = item.sourceType !== "MERCHANT";

  const edit = () =>
    router.push({
      pathname: "/merchant/price-form",
      params: { priceId: item.id, name: item.productName, price: String(item.price), displayName: item.displayName ?? "" },
    });

  return (
    <AnimatedPressable accessibilityLabel={`Editar ${name}, ${formatPrice(item.price)}`} haptic={false} onPress={edit} style={styles.row}>
      <ProductThumb name={name} size={44} />
      <View style={styles.flex}>
        <Text style={styles.rowName} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[item.brandName, item.unitSize > 0 ? `${item.unitSize}${item.unit}` : null].filter(Boolean).join(" · ")}
        </Text>
        {fromPublicSource ? <Text style={styles.badge}>Precio publicado por SEPA · tocá para confirmarlo</Text> : null}
      </View>
      <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
      <Ionicons name="create-outline" size={18} color={colors.text.secondary} />
    </AnimatedPressable>
  );
}
