import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { findBrandLogo } from "@/lib/stores/matchBrandLogo";
import { useBrandLogos } from "@/lib/stores/useBrandLogos";
import { useColors } from "@/lib/theme";

interface StoreBadgeProps {
  storeName: string;
  size?: number;
}

/**
 * Logo de un comercio (guardado en la base de datos). Va sobre un recuadro blanco porque los
 * logos traen su propio fondo; si no tenemos el logo de esa cadena queda un ícono de local.
 */
export function StoreBadge({ storeName, size = 40 }: StoreBadgeProps) {
  const colors = useColors();
  const logo = findBrandLogo(useBrandLogos(), storeName);
  const radius = Math.round(size * 0.24);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.box,
        { width: size, height: size, borderRadius: radius, backgroundColor: logo ? "#FFFFFF" : colors.surface.input },
      ]}
    >
      {logo ? (
        <Image source={{ uri: logo.imageDataUri }} style={{ width: size - 4, height: size - 4 }} contentFit="contain" cachePolicy="memory-disk" />
      ) : (
        <Ionicons name="storefront-outline" size={Math.round(size * 0.5)} color={colors.text.tertiary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
