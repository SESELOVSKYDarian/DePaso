import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { radii, spacing } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

/** Cuánto se ve de la hoja en cada posición (en píxeles, desde abajo). */
export const PEEK_VISIBLE = 320;
const CLOSED_VISIBLE = 88;

interface MapSheetProps {
  /** Alto del espacio donde vive la hoja (el del mapa). */
  containerHeight: number;
  /** Parte de arriba, la que se agarra para arrastrar (título + "Ver todos"). */
  header: ReactNode;
  children: ReactNode;
  /** Cada vez que cambia, la hoja se abre del todo ("Ver todos"). */
  expandSignal?: number;
  /** Espacio libre arriba cuando la hoja está abierta del todo (el buscador sigue a la vista). */
  topGap: number;
}

/**
 * Hoja deslizable estilo iPhone sobre el mapa. Se arrastra desde el asa y el título, se suelta y
 * se acomoda sola en la posición más cercana (resorte con la velocidad del dedo). Solo cuando está
 * abierta del todo el contenido de adentro se desplaza.
 */
export function MapSheet({ containerHeight, header, children, expandSignal = 0, topGap }: MapSheetProps) {
  const styles = useStyles();
  const sheetHeight = Math.max(0, containerHeight - topGap);
  // posiciones como desplazamiento hacia abajo: 0 = abierta del todo
  const snaps = useMemo(() => {
    const peek = Math.max(0, sheetHeight - PEEK_VISIBLE);
    const closed = Math.max(peek, sheetHeight - CLOSED_VISIBLE);
    return { full: 0, peek, closed };
  }, [sheetHeight]);

  const translateY = useSharedValue(snaps.peek);
  const startY = useSharedValue(0);
  const [isFull, setIsFull] = useState(false);

  // al cambiar el tamaño del mapa, vuelve a la posición a medias
  useEffect(() => {
    translateY.set(snaps.peek);
    setIsFull(false);
  }, [snaps.peek, translateY]);

  // "Ver todos": abre del todo
  useEffect(() => {
    if (expandSignal === 0) return;
    translateY.set(withSpring(snaps.full, { duration: 300, dampingRatio: 0.9 }));
    setIsFull(true);
  }, [expandSignal, snaps.full, translateY]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.set(translateY.get());
    })
    .onUpdate((event) => {
      // sin pasarse de los extremos
      const next = startY.get() + event.translationY;
      translateY.set(Math.min(snaps.closed, Math.max(snaps.full, next)));
    })
    .onEnd((event) => {
      // se proyecta hacia dónde iba el dedo y se elige la posición más cercana
      const projected = translateY.get() + event.velocityY * 0.15;
      const options = [snaps.full, snaps.peek, snaps.closed];
      let target = options[0]!;
      for (const option of options) {
        if (Math.abs(option - projected) < Math.abs(target - projected)) target = option;
      }
      translateY.set(withSpring(target, { duration: 300, dampingRatio: 0.8, velocity: event.velocityY }));
      scheduleOnRN(setIsFull, target === snaps.full);
    });

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));

  if (sheetHeight === 0) return null;

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight }, animatedStyle]}>
      <GestureDetector gesture={pan}>
        <View>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          {header}
        </View>
      </GestureDetector>
      <ScrollView scrollEnabled={isFull} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    sheet: {
      position: "absolute",
      // por encima de los botones flotantes (zIndex 20) y por debajo del buscador (30)
      zIndex: 25,
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      backgroundColor: colors.surface.base,
      borderTopWidth: 1,
      borderColor: colors.border.subtle,
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    handleArea: { alignItems: "center", paddingTop: spacing.sm, paddingBottom: spacing.xs },
    handle: { width: 40, height: 5, borderRadius: radii.full, backgroundColor: colors.border.strong },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  }),
);
