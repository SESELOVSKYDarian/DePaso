import { StyleSheet, Text, View } from "react-native";
import { storeBrand } from "@/lib/stores/storeBrand";

interface StoreBadgeProps {
  storeName: string;
  size?: number;
}

/** Ícono cuadrado de un comercio: color de la cadena y sus iniciales. */
export function StoreBadge({ storeName, size = 40 }: StoreBadgeProps) {
  const brand = storeBrand(storeName);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: brand.background }]}
    >
      <Text
        numberOfLines={1}
        style={{ color: brand.text, fontWeight: "800", fontSize: Math.round(size * (brand.initials.length > 2 ? 0.3 : 0.4)) }}
      >
        {brand.initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
