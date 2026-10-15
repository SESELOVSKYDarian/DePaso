import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { ProgressHeader } from "./ProgressHeader";

interface AuthStepProps {
  /** Paso actual (1-based) y total, para el contador y la barra de progreso. */
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  /** Botón principal. Va fijo abajo, sobre el teclado, al alcance del pulgar. */
  footer: ReactNode;
  children: ReactNode;
}

/**
 * Esqueleto de cada pantalla de un flujo de varios pasos (recuperar contraseña): una sola
 * tarea por pantalla, título grande, contenido arriba y la acción principal abajo.
 */
export function AuthStep({ step, totalSteps, title, subtitle, onBack, footer, children }: AuthStepProps) {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <ProgressHeader progress={step / totalSteps} onBack={onBack} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepLabel}>
            Paso {step} de {totalSteps}
          </Text>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    header: {
      paddingHorizontal: spacing.lg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    stepLabel: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: typography.heroTitle.fontFamily,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.primary,
    },
    subtitle: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
      marginTop: spacing.xs,
    },
    body: {
      marginTop: spacing.xl,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
  }),
);
