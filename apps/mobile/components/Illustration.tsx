import { Image, StyleSheet, View, type ImageProps } from "react-native";
import { radii, spacing } from "@depaso/design-tokens";
import { useTheme } from "@/lib/theme";

/** Fondo claro fijo detrás de las ilustraciones en modo oscuro (sus trazos son navy). */
const PANEL_COLOR = "#F2F2F7";

interface IllustrationProps extends ImageProps {
  /** Panel más ajustado, para ilustraciones chicas dentro de una tarjeta. */
  compact?: boolean;
}

/**
 * Ilustración de marca. Las ilustraciones son PNG transparentes con trazos navy: sobre un
 * fondo oscuro se perderían, así que en modo oscuro se apoyan en un panel claro redondeado.
 * En modo claro es simplemente la imagen.
 */
export function Illustration({ compact = false, style, ...props }: IllustrationProps) {
  const { isDark } = useTheme();
  if (!isDark) return <Image {...props} style={style} />;

  return (
    <View style={[styles.panel, compact ? styles.compact : null]}>
      <Image {...props} style={style} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: "center",
    backgroundColor: PANEL_COLOR,
    borderRadius: radii.xl,
    padding: spacing.sm,
    overflow: "hidden",
  },
  compact: {
    padding: spacing.xxs,
    borderRadius: radii.lg,
  },
});
