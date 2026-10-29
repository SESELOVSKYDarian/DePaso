import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Anillo que late alrededor del micrófono mientras se graba.
 * Queda quieto si el sistema pide reducir el movimiento.
 */
export function usePulseRing(isRecording: boolean) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

  useEffect(() => {
    if (isRecording && !reducedMotion) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [isRecording, reducedMotion, pulse]);

  return pulseStyle;
}
