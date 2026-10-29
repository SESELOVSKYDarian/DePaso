import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";

interface LoadingOverlayProps {
  visible: boolean;
  title: string;
  /** Frases que van rotando para que se entienda qué se está haciendo. */
  steps: string[];
}

/** Un punto que sube y baja; tres desfasados dan el "latido" del cargador. */
function Dot({ delay }: { delay: number }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [delay, progress, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 1 : 0.35 + 0.65 * progress.value,
    transform: [{ translateY: reduced ? 0 : -8 * progress.value }],
  }));
  return <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text.primary }, style]} />;
}

/**
 * Cargador a pantalla completa para esperas largas (armar la compra). Muestra qué se está
 * haciendo con frases que cambian, así la espera se siente corta y no parece colgado.
 */
export function LoadingOverlay({ visible, title, steps }: LoadingOverlayProps) {
  const styles = useStyles();
  const colors = useColors();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setIndex(0);
      return;
    }
    const timer = setInterval(() => setIndex((current) => Math.min(current + 1, steps.length - 1)), 1400);
    return () => clearInterval(timer);
  }, [visible, steps.length]);

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
      <View style={styles.container} accessibilityLiveRegion="polite">
        <View style={styles.badge}>
          <Ionicons name="navigate" size={32} color={colors.text.onNavy} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={170} />
          <Dot delay={340} />
        </View>
        <Text style={styles.step}>{steps[index]}</Text>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.lg,
      padding: spacing.xl,
      backgroundColor: colors.surface.base,
    },
    badge: {
      width: 72,
      height: 72,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.navy,
    },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 26, lineHeight: 32, color: colors.text.primary, textAlign: "center" },
    dots: { flexDirection: "row", gap: spacing.sm, height: 28, alignItems: "flex-end" },
    step: { fontFamily: typography.subtitle.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary, textAlign: "center", minHeight: 44 },
  }),
);
