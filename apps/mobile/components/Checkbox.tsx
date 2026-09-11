import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { colors, motion, radii, spacing, typography } from "@depaso/design-tokens";

const AnimatedView = Animated.createAnimatedComponent(View);

interface CheckboxProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  children: ReactNode;
  accessibilityLabel: string;
  error?: string;
}

/** Checkbox animado (sección 68: "animar checkboxes de forma satisfactoria — pequeño
 * spring + haptic"). No usa lima — el lima es exclusivo de ahorro/mejor opción. */
export function Checkbox({ checked, onToggle, children, accessibilityLabel, error }: CheckboxProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = reducedMotion
      ? 1
      : withSequence(withSpring(1.15, motion.spring.bouncy), withSpring(1, motion.spring.snappy));
    void Haptics.selectionAsync();
    onToggle(!checked);
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        style={styles.row}
      >
        <AnimatedView
          style={[
            styles.box,
            animatedStyle,
            checked ? styles.boxChecked : null,
            error ? styles.boxError : null,
          ]}
        >
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </AnimatedView>
        <View style={styles.label}>{children}</View>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radii.sm - 4,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.brand.navy,
    borderColor: colors.brand.navy,
  },
  boxError: {
    borderColor: colors.state.error,
  },
  check: {
    color: colors.text.onNavy,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  label: {
    flex: 1,
  },
  error: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.state.error,
    marginTop: spacing.xxs,
    marginLeft: 34,
  },
});
