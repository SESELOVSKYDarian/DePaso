import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAuth } from "@/lib/auth/AuthContext";

const CHECKLIST = ["Perfil verificado", "Lugares guardados", "Preferencias listas"] as const;

/** Cierre del setup (depaso-listo en Figma). `completePostSignup()` flipea el guard raíz,
 * pero desde que `places/*` quedó alcanzable también durante el setup (bug real: "Agregar
 * Casa" no navegaba, encontrado probando el flujo completo), el swap de guard solo ya no
 * alcanza — si el usuario tocó "Otro lugar"/`places/form` antes de llegar acá, esa sigue
 * siendo una ruta válida después del flip y el Stack no tiene motivo para moverse de ahí.
 * `router.replace` fuerza el aterrizaje en Home explícitamente. */
export default function SetupDoneScreen() {
  const { completePostSignup } = useAuth();

  const handleStart = () => {
    completePostSignup();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Image source={require("../../assets/images/listo.png")} style={styles.illustration} resizeMode="contain" />
        <Text style={styles.title}>¡Listo!</Text>
        <Text style={styles.subtitle}>Tu cuenta ya está creada.</Text>

        <View style={styles.checklist}>
          {CHECKLIST.map((item) => (
            <View key={item} style={styles.checklistRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color={colors.brand.accentDark} />
              </View>
              <Text style={styles.checklistLabel}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <AnimatedPressable
          accessibilityLabel="Empezar a usar DePaso"
          onPress={handleStart}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryLabel}>Empezar a usar DePaso</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  illustration: {
    width: 220,
    height: 190,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 48,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  checklist: {
    gap: spacing.sm,
    alignSelf: "stretch",
    paddingHorizontal: spacing.md,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.tint.green.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistLabel: {
    flex: 1,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
  },
  footer: {
    padding: spacing.lg,
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
});
