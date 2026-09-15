import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

/**
 * Count-up numérico (MOTION-SYSTEM.md, "Count-up del ahorro", 300-600ms) — anima un número
 * de 0 al valor final con una curva ease-out (rápido al arrancar, se asienta al final, sin
 * rebote — un monto de dinero no "rebota"). Con Reduce Motion, va directo al valor final.
 */
export function useCountUp(target: number, durationMs = 500): number {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }
    startRef.current = null;
    setValue(0);

    function step(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    }

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, reducedMotion]);

  return value;
}
