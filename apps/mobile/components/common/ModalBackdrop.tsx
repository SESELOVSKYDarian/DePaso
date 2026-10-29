import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";

interface ModalBackdropProps {
  children: ReactNode;
  /** Tocar afuera del contenido (p. ej. cerrar una hoja). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fondo de todos los modales: lo de atrás se ve oscurecido y desenfocado (no violeta). El
 * desenfoque es estático —nunca se anima— porque animar un BlurView en Android falla.
 */
export function ModalBackdrop({ children, onPress, style }: ModalBackdropProps) {
  const { isDark } = useTheme();
  return (
    <View style={[styles.root, style]}>
      <BlurView
        intensity={Platform.OS === "android" ? 18 : 24}
        tint={isDark ? "dark" : "default"}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityLabel="Cerrar"
        disabled={!onPress}
        onPress={onPress}
        style={[StyleSheet.absoluteFill, styles.dim]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dim: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
});
