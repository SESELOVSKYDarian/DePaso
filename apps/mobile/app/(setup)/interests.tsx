import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ProgressHeader } from "@/components/ProgressHeader";
import { SelectCheckbox } from "@/components/SelectCheckbox";

interface Interest {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}

const INTERESTS: Interest[] = [
  { key: "prices", icon: "swap-vertical-outline", label: "Buscar mejores precios", hint: "Recomendado", defaultChecked: true },
  { key: "optimize", icon: "cart-outline", label: "Optimizar mis compras", defaultChecked: true },
  { key: "routes", icon: "location-outline", label: "Planificar según mis recorridos", defaultChecked: true },
  { key: "favorites", icon: "heart-outline", label: "Guardar mis marcas favoritas" },
  { key: "community", icon: "people-outline", label: "Participar en la comunidad" },
];

/**
 * Preferencias de interés (depaso-intereses en Figma). No existe campo de preferencias en
 * `@depaso/validation`/`@depaso/domain` todavía — la selección queda sólo en memoria de esta
 * pantalla (no se persiste) hasta que haya un endpoint de perfil que la reciba.
 */
export default function InterestsSetupScreen() {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(INTERESTS.filter((i) => i.defaultChecked).map((i) => i.key))
  );

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.95} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>¿Qué te interesa?</Text>
        <Text style={styles.subtitle}>Esto nos ayuda a personalizar tu experiencia.</Text>

        <View style={styles.list}>
          {INTERESTS.map((interest) => {
            const isChecked = checked.has(interest.key);
            return (
              <AnimatedPressable
                key={interest.key}
                accessibilityLabel={interest.label}
                haptic={false}
                onPress={() => toggle(interest.key)}
                style={styles.row}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={interest.icon} size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{interest.label}</Text>
                  {interest.hint ? <Text style={styles.rowHint}>{interest.hint}</Text> : null}
                </View>
                <SelectCheckbox checked={isChecked} />
              </AnimatedPressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable accessibilityLabel="Continuar" onPress={() => router.push("/(setup)/done")} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Continuar</Text>
        </AnimatedPressable>
        <Text style={styles.footerHint}>Podrás cambiarlo después en tu perfil.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
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
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    minHeight: 44,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface.input,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  rowHint: {
    fontFamily: typography.legal.fontFamily,
    fontSize: 11,
    color: colors.brand.accentDark,
    marginTop: 1,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.xs,
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
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    color: colors.text.onNavy,
  },
  footerHint: {
    textAlign: "center",
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
  },
});
