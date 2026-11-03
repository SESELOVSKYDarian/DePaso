import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
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
 * en un recuadro blanco también en modo oscuro. Mientras la foto carga (o si no hay, o si falla)
 * se ve un ícono según el tipo de producto (leche, carne, limpieza…): nunca un recuadro en blanco.
 */
export function ProductThumb({ imageUrl, name, size = 52 }: ProductThumbProps) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const hasImage = Boolean(imageUrl) && !failed;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.box,
        {
          width: size,
          height: size,
          // el fondo blanco recién aparece cuando la foto ya está; antes se ve el ícono
          backgroundColor: hasImage && loaded ? "#FFFFFF" : colors.surface.input,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {!(hasImage && loaded) ? <Ionicons name={productIcon(name)} size={Math.round(size * 0.42)} color={colors.text.tertiary} /> : null}
      {hasImage ? (
        <Image
          source={{ uri: imageUrl as string }}
          style={[styles.image, { width: size - 8, height: size - 8, opacity: loaded ? 1 : 0 }]}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          recyclingKey={imageUrl as string}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
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
  // la foto se superpone al ícono, centrada
  image: { position: "absolute" },
});
