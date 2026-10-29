import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { dayStamp, msUntilMidnight } from "./dayStamp";

/**
 * Avisa cuando cambia el día (00:00 hora del celular). Hay dos casos:
 * - la app queda abierta toda la noche: un temporizador salta a medianoche;
 * - el celular estuvo dormido y los temporizadores se frenaron: al volver a la app se compara el día.
 */
export function useMidnightReset(onNewDay: () => void): void {
  const callback = useRef(onNewDay);
  callback.current = onNewDay;

  useEffect(() => {
    let lastDay = dayStamp();
    let timer: ReturnType<typeof setTimeout>;

    const checkDay = () => {
      const today = dayStamp();
      if (today !== lastDay) {
        lastDay = today;
        callback.current();
      }
    };
    // un segundo de margen para no despertar justo antes de las 00:00
    const schedule = () => {
      timer = setTimeout(() => {
        checkDay();
        schedule();
      }, msUntilMidnight() + 1000);
    };
    schedule();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkDay();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
}
