import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { PRICE_DISCLOSURE_NOTICE } from "@/lib/priceDisclosure";

/**
 * Aviso persistente obligatorio antes de mostrar resultados con precios/ahorros
 * (FLOWS.md "Flujo de consentimiento" p.6-19-20, paso 4; BUSINESS-RULES.md p.9,
 * microcopy legal literal). Se muestra una sola vez por pantalla, no por precio — repetirlo
 * por ítem sería ruido, no protección real para el usuario.
 */
export function PriceDisclosureBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{PRICE_DISCLOSURE_NOTICE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.tint.amber.bg,
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
  },
  text: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    color: colors.tint.amber.text,
  },
});
