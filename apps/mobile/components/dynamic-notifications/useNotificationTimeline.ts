import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  AUTO_DISMISS,
  COLLAPSE_SPRING,
  DROP_SPRING,
  ENTER_EXPAND_DELAY,
  ENTER_REVEAL_DELAY,
  ENTER_TINT_DELAY,
  EXIT_COLLAPSE_DELAY,
  EXIT_DROP_DELAY,
  EXPAND_SPRING,
  FADE_SPRING,
  REDUCED_MOTION_FADE_MS,
  RETURN_SPRING,
  REVEAL_SPRING,
  TINT_SPRING,
} from "@/lib/notifications/constants";
import type { AppNotification } from "./context";

/**
 * Máquina de estados de una notificación: gota que cae → tarjeta que se abre → contenido que
 * aparece, y a la inversa al salir. Una a la vez: si llega otra, la actual sale y entra la
 * nueva (sólo se conserva la última en cola).
 */
export function useNotificationTimeline(defaultDuration?: number | null) {
  const reduced = useReducedMotion();

  const drop = useSharedValue(0);
  const expand = useSharedValue(0);
  const reveal = useSharedValue(0);
  const tint = useSharedValue(1);
  const dragY = useSharedValue(0);

  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef<AppNotification | null>(null);
  const queued = useRef<AppNotification | null>(null);
  const exiting = useRef(false);
  const exitRef = useRef<() => void>(() => undefined);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const enter = useCallback(
    (next: AppNotification) => {
      clearTimer();
      current.current = next;
      exiting.current = false;
      setNotification(next);
      setIsVisible(true);
      setSession((value) => value + 1);

      cancelAnimation(drop);
      cancelAnimation(expand);
      cancelAnimation(reveal);
      cancelAnimation(tint);

      drop.set(0);
      expand.set(0);
      reveal.set(0);
      tint.set(0);
      dragY.set(0);

      const fallback = defaultDuration === undefined ? AUTO_DISMISS : defaultDuration;
      const lifetime = next.duration === undefined ? fallback : next.duration;
      if (lifetime !== null) {
        const lead = reduced ? REDUCED_MOTION_FADE_MS : ENTER_REVEAL_DELAY;
        timer.current = setTimeout(() => exitRef.current(), lead + lifetime);
      }
    },
    [clearTimer, defaultDuration, dragY, drop, expand, reduced, reveal, tint],
  );

  useEffect(() => {
    if (session === 0) return;

    if (reduced) {
      drop.set(1);
      expand.set(1);
      tint.set(1);
      reveal.set(withTiming(1, { duration: REDUCED_MOTION_FADE_MS }));
      return;
    }

    drop.set(withSpring(1, DROP_SPRING));
    tint.set(withDelay(ENTER_TINT_DELAY, withSpring(1, TINT_SPRING)));
    expand.set(withDelay(ENTER_EXPAND_DELAY, withSpring(1, EXPAND_SPRING)));
    reveal.set(withDelay(ENTER_REVEAL_DELAY, withSpring(1, REVEAL_SPRING)));
  }, [session, reduced, drop, expand, reveal, tint]);

  const settle = useCallback(() => {
    const next = queued.current;
    current.current = null;
    queued.current = null;
    exiting.current = false;
    setIsVisible(false);

    if (next) {
      enter(next);
    } else {
      setNotification(null);
    }
  }, [enter]);

  const exit = useCallback(() => {
    if (!current.current || exiting.current) return;
    exiting.current = true;
    clearTimer();

    if (reduced) {
      reveal.set(
        withTiming(0, { duration: REDUCED_MOTION_FADE_MS }, (finished?: boolean) => {
          "worklet";
          if (finished) scheduleOnRN(settle);
        }),
      );
      return;
    }

    reveal.set(withSpring(0, FADE_SPRING));
    expand.set(withDelay(EXIT_COLLAPSE_DELAY, withSpring(0, COLLAPSE_SPRING)));
    tint.set(withDelay(EXIT_DROP_DELAY, withSpring(0, RETURN_SPRING)));
    drop.set(
      withDelay(
        EXIT_DROP_DELAY,
        withSpring(0, RETURN_SPRING, (finished?: boolean) => {
          "worklet";
          if (finished) scheduleOnRN(settle);
        }),
      ),
    );
  }, [clearTimer, drop, expand, reduced, reveal, settle, tint]);

  exitRef.current = exit;

  const trigger = useCallback(
    (next: AppNotification) => {
      if (current.current) {
        queued.current = next;
        exit();
        return;
      }
      enter(next);
    },
    [enter, exit],
  );

  const dismiss = useCallback(() => {
    queued.current = null;
    exit();
  }, [exit]);

  useEffect(() => clearTimer, [clearTimer]);

  return { drop, expand, reveal, tint, dragY, notification, isVisible, trigger, dismiss, simple: reduced };
}
