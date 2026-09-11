import { useEffect } from "react";
import { StyleSheet, type DimensionValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radii } from "@depaso/design-tokens";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

/** Placeholder de carga (sección 27: "usar skeletons, evitar spinner gigante + pantalla
 * vacía"). Pulso sutil de opacidad, sin depender de layout animation pesada. */
export function Skeleton({ width = "100%", height = 16, borderRadius = radii.sm }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.5, { duration: 600 })),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius }, animatedStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border.subtle,
  },
});
