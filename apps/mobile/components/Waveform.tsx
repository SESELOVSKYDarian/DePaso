import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useColors } from "@/lib/theme";

const BAR_COUNT = 33;
const BAR_WIDTH = 4;
const BAR_GAP = 4;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 64;
/** Un poco de resalte al centro: la onda se ve como una "voz" y no como un histograma plano. */
const centerBoost = (index: number) => 0.55 + 0.45 * Math.sin((Math.PI * (index + 0.5)) / BAR_COUNT);

interface WaveformProps {
  /** Volumen actual, de 0 a 1. */
  level: number;
  /** Cambia en cada lectura (p. ej. los milisegundos grabados): empuja una barra nueva. */
  tick: number;
  /** Con `false` las barras bajan al mínimo (sin grabar). */
  active: boolean;
}

/**
 * Ondas de audio en vivo: cada lectura del micrófono entra por la derecha y las barras viejas
 * se corren a la izquierda, como un osciloscopio. Con "reducir movimiento" no se suaviza la
 * altura (sigue siendo información, pero sin transiciones).
 */
export function Waveform({ level, tick, active }: WaveformProps) {
  const [history, setHistory] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  useEffect(() => {
    if (!active) {
      setHistory(Array(BAR_COUNT).fill(0));
      return;
    }
    setHistory((current) => [...current.slice(1), level]);
    // `tick` está a propósito: se agrega una barra por lectura aunque el volumen no cambie.
  }, [tick, active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.row}>
      {history.map((value, index) => (
        <Bar key={index} level={Math.min(1, value * centerBoost(index))} />
      ))}
    </View>
  );
}

const Bar = memo(function Bar({ level }: { level: number }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const height = useSharedValue(MIN_HEIGHT);

  useEffect(() => {
    const target = MIN_HEIGHT + level * (MAX_HEIGHT - MIN_HEIGHT);
    height.value = reduced ? target : withTiming(target, { duration: 90, easing: Easing.out(Easing.quad) });
  }, [level, reduced, height]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.bar, { backgroundColor: colors.brand.navy }, style]} />;
});

const styles = StyleSheet.create({
  row: {
    height: MAX_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
});
