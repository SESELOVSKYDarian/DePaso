import { Ionicons } from "@expo/vector-icons";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { ProgressHeader } from "@/components/common/ProgressHeader";
import { downloadManual } from "@/features/howto/downloadManual";
import { HowToSteps } from "@/features/howto/HowToSteps";
import { makeStyles, useColors } from "@/lib/theme";

/**
 * Último paso antes de "¡Listo!": cómo se usa DePaso, en cinco pasos. Se puede seguir o saltear;
 * el manual completo queda disponible en Ayuda.
 */
export default function SetupGuideScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const goNext = () => router.push("/(setup)/done");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.95} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          Así se usa DePaso
        </Text>
        <Text style={styles.subtitle}>Cinco pasos y ya estás ahorrando de paso.</Text>
        <HowToSteps />
        <AnimatedPressable
          accessibilityLabel="Descargar el manual de usuario en PDF"
          haptic={false}
          onPress={() => {
            setFailed(false);
            downloadManual().catch(() => setFailed(true));
          }}
          style={styles.manual}
        >
          <Ionicons name="download-outline" size={18} color={colors.brand.route} />
          <Text style={styles.manualLabel}>Descargar el manual completo (PDF)</Text>
        </AnimatedPressable>
        {failed ? <Text style={styles.error}>No pudimos abrir la descarga. Lo encontrás después en Perfil › Ayuda.</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable accessibilityLabel="Continuar" onPress={goNext} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Continuar</Text>
        </AnimatedPressable>
        <AnimatedPressable accessibilityLabel="Omitir la guía" haptic={false} onPress={goNext} style={styles.skip}>
          <Text style={styles.skipLabel}>Omitir</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    content: { padding: spacing.lg, gap: spacing.md },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 28, lineHeight: 34, color: colors.text.primary },
    subtitle: { fontFamily: typography.subtitle.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
    manual: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, minHeight: 44 },
    manualLabel: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.brand.route },
    error: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.state.errorStrong, textAlign: "center" },
    footer: { padding: spacing.lg, gap: spacing.xs },
    primaryButton: { minHeight: 52, borderRadius: radii.full, backgroundColor: colors.brand.navy, alignItems: "center", justifyContent: "center" },
    primaryLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 16, color: colors.text.onNavy },
    skip: { minHeight: 44, alignItems: "center", justifyContent: "center" },
    skipLabel: { fontFamily: typography.body.fontFamily, fontSize: 15, color: colors.text.secondary },
  }),
);
