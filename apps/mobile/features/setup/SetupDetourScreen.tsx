import { radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { DetourPicker } from "@/components/map/DetourPicker";
import { ProgressHeader } from "@/components/common/ProgressHeader";
import { makeStyles } from "@/lib/theme";

/**
 * "¿Cuánto te querés desviar?": cuántas cuadras aceptás salirte del camino en cada nivel de
 * compra. Siempre se puede cambiar después en Perfil → Cuánto me desvío.
 */
export default function DetourSetupScreen() {
  const styles = useStyles();
  const goNext = () => router.push("/(setup)/done");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.85} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          ¿Cuánto te desviás para ahorrar?
        </Text>
        <Text style={styles.subtitle}>
          Una cuadra son unos 100 metros. Elegí hasta dónde llegás en cada opción; el nivel hipereconómico no tiene tope.
        </Text>
        <DetourPicker />
        <Text style={styles.note}>Lo podés cambiar cuando quieras en Perfil.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable accessibilityLabel="Continuar" onPress={goNext} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Continuar</Text>
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
    note: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary, textAlign: "center" },
    footer: { padding: spacing.lg },
    primaryButton: {
      minHeight: 52,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 16, color: colors.text.onNavy },
  }),
);
