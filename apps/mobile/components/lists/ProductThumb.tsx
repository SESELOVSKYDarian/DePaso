import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { radii } from "@depaso/design-tokens";
import { productIcon } from "@/lib/products/productIcon";
import { useColors } from "@/lib/theme";

interface ProductThumbProps {
  imageUrl?: string | null;
  /** Nombre del producto: con él se elige un ícono parecido cuando no hay foto. */
  name?: string | null;
  size?: number;
}

/**
 * Miniatura de producto. Las fotos (Open Food Facts) vienen sobre fondo blanco, así que van
 * en un recuadro blanco también en modo oscuro; sin foto (o si falla la carga) queda un ícono
 * según el tipo de producto (leche, carne, limpieza…).
 */
export function ProductThumb({ imageUrl, name, size = 52 }: ProductThumbProps) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.box,
        {
          width: size,
          height: size,
          backgroundColor: showImage ? "#FFFFFF" : colors.surface.input,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUrl as string }}
          style={{ width: size - 8, height: size - 8 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Ionicons name={productIcon(name)} size={Math.round(size * 0.42)} color={colors.text.tertiary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
