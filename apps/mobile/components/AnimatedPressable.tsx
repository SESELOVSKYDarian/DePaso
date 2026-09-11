import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { motion } from "@depaso/design-tokens";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  /** Feedback háptico con moderación (sección 20) — sólo en acciones que lo ameritan. */
  haptic?: boolean;
}

/**
 * Botón base con feedback de press (spring snappy) y haptic opcional. Respeta "Reduce
 * Motion" del sistema (sección 19): si está activo, cambia de escala sin spring animado.
 */
export function AnimatedPressable({
  children,
  onPress,
  style,
  accessibilityLabel,
  haptic = true,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = reducedMotion ? 0.98 : withSpring(0.96, motion.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = reducedMotion ? 1 : withSpring(1, motion.spring.snappy);
  };
  const handlePress = () => {
    if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressableBase
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
