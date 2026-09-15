import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ProgressHeader } from "@/components/ProgressHeader";
import { useToast } from "@/components/Toast";

const BENEFITS = ["Mejores resultados", "Rutas más precisas", "Siempre podés cambiarlo en la configuración"] as const;

/**
 * Consentimiento de ubicación (depaso-ubicacion en Figma). Consentimiento específico "por
 * uso" — no tracking continuo — con alternativa manual siempre visible, como pide
 * docs/legal-functional/LEGAL.md (p.4, "Privacidad por diseño para ubicación" y la tabla de
 * consentimiento p.6: "Permitir ubicación..." / "Ingresar dirección manualmente").
 */
export default function LocationSetupScreen() {
  const { show: showToast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);

  const goNext = () => router.push("/(setup)/places");

  const handleUseLocation = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("No dimos permiso — podés ingresar tu dirección manualmente cuando lo necesites.", "info");
      }
    } finally {
      setIsRequesting(false);
      goNext();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.7} onBack={() => router.back()} />
      </View>

      <View style={styles.content}>
        <Image source={require("../../assets/images/ubicacion.png")} style={styles.illustration} resizeMode="contain" />

        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Opcional por ahora</Text>
        </View>

        <Text style={styles.title}>¿Usamos tu ubicación?</Text>
        <Text style={styles.subtitle}>
          Nos ayuda a encontrar comercios cerca tuyo y calcular cuánto tendrías que desviarte.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <View style={styles.benefitCheckCircle}>
                <Ionicons name="checkmark" size={12} color={colors.brand.accentDark} />
              </View>
              <Text style={styles.benefitLabel}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <AnimatedPressable
          accessibilityLabel="Usar mi ubicación"
          onPress={() => void handleUseLocation()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryLabel}>{isRequesting ? "Pidiendo permiso..." : "Usar mi ubicación"}</Text>
        </AnimatedPressable>
        <AnimatedPressable accessibilityLabel="Ingresar dirección manualmente" haptic={false} onPress={goNext} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>Ingresar dirección manualmente</Text>
        </AnimatedPressable>
        <Text style={styles.skipLink} onPress={goNext}>
          Ahora no
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  illustration: {
    width: 220,
    height: 190,
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.tint.green.bg,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginBottom: spacing.sm,
  },
  badgeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.brand.accentDark,
  },
  title: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 22,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  benefits: {
    alignSelf: "stretch",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  benefitCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.tint.green.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitLabel: {
    flex: 1,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryLabel: {
    fontFamily: typography.buttonLabel.fontFamily,
    fontSize: 16,
    color: colors.text.onNavy,
  },
  secondaryButton: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  secondaryLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  skipLink: {
    textAlign: "center",
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
    paddingVertical: spacing.xs,
    textDecorationLine: "underline",
  },
});
