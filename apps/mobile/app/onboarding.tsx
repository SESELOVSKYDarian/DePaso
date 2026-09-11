import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Onboarding breve (sección 29 del master prompt — "no crear un onboarding de 12
 * pantallas"): 3 slides que explican el diferencial (desvío, no sólo precio), la
 * privacidad de ubicación, y el rol de la comunidad en los precios.
 */
const SLIDES = [
  {
    title: "Encontrá lo que realmente te conviene",
    body: "DePaso no busca sólo el precio más bajo. Mira tu recorrido de hoy y te dice qué compra tiene sentido en el camino.",
  },
  {
    title: "Tu ubicación, sólo cuando la necesitás",
    body: "Te la pedimos recién cuando vas a buscar tu mejor compra. No guardamos un historial de tus movimientos.",
  },
  {
    title: "Precios con ayuda de la comunidad",
    body: "Mostramos de dónde sale cada precio y hace cuánto se actualizó. Si algo cambió, cualquiera puede reportarlo.",
  },
] as const;

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index]!;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
      </View>

      <Animated.View key={index} entering={FadeIn.duration(220)} style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </Animated.View>

      <View style={styles.actions}>
        {!isLast ? (
          <AnimatedPressable
            accessibilityLabel="Omitir introducción"
            haptic={false}
            onPress={() => void completeOnboarding()}
            style={styles.skipButton}
          >
            <Text style={styles.skipLabel}>Omitir</Text>
          </AnimatedPressable>
        ) : (
          <View style={styles.skipButton} />
        )}

        <AnimatedPressable
          accessibilityLabel={isLast ? "Empezar" : "Siguiente"}
          onPress={() => (isLast ? void completeOnboarding() : setIndex((i) => i + 1))}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryLabel}>{isLast ? "Empezar" : "Siguiente"}</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xxs,
    marginTop: spacing.lg,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border.subtle,
  },
  dotActive: {
    backgroundColor: colors.brand.navy,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: typography.display.fontFamily,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: typography.bodyRegular.fontSize,
    lineHeight: typography.bodyRegular.lineHeight,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  skipButton: {
    minHeight: 44,
    minWidth: 80,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  skipLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.text.muted,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
});
