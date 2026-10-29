import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { makeStyles, useColors } from "@/lib/theme";

interface GuidePanelProps {
  hasList: boolean;
  hasRoute: boolean;
  hasPlan: boolean;
}

interface Step {
  title: string;
  description: string;
  done: boolean;
  cta: string;
  onPress: () => void;
}

/**
 * Guía de bienvenida: los 3 pasos para empezar a ahorrar, marcando los que ya están hechos.
 * Solo el paso que toca ahora muestra su botón; al completar los dos primeros, Inicio pasa a
 * mostrar el resumen de la lista.
 */
export function GuidePanel({ hasList, hasRoute, hasPlan }: GuidePanelProps) {
  const styles = useStyles();
  const colors = useColors();

  const steps: Step[] = [
    {
      title: "Armá tu lista",
      description: "Sumá lo que necesitás comprar. Podés buscarlo o decírselo a la IA.",
      done: hasList,
      cta: "Armar mi lista",
      onPress: () => router.push("/lists/form"),
    },
    {
      title: "Elegí por dónde pasás",
      description: "Contanos de dónde salís y a dónde vas hoy. También podés buscar lugares en el mapa.",
      done: hasRoute,
      cta: "Elegir mi recorrido",
      onPress: () => router.push("/route-context"),
    },
    {
      title: "Mirá dónde comprar de paso",
      description: "Te mostramos el comercio más barato de tu camino y cuánto te desviás.",
      done: hasPlan,
      cta: "Ver dónde comprar",
      onPress: () => router.push("/optimization"),
    },
  ];
  const currentIndex = steps.findIndex((step) => !step.done);

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Empecemos en 3 pasos
      </Text>
      <Text style={styles.subtitle}>Así sacás el máximo de DePaso.</Text>

      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        return (
          <View key={step.title} style={[styles.step, isCurrent ? styles.stepCurrent : null]}>
            <View style={[styles.marker, step.done ? styles.markerDone : null, isCurrent ? styles.markerCurrent : null]}>
              {step.done ? (
                <Ionicons name="checkmark" size={16} color={colors.text.onNavy} />
              ) : (
                <Text style={[styles.markerNumber, isCurrent ? styles.markerNumberCurrent : null]}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.stepText}>
              <Text style={[styles.stepTitle, step.done ? styles.stepTitleDone : null]}>{step.title}</Text>
              {isCurrent || !step.done ? <Text style={styles.stepDescription}>{step.description}</Text> : null}
              {isCurrent ? <Button label={step.cta} onPress={step.onPress} style={styles.cta} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    title: { fontFamily: typography.screenTitle.fontFamily, fontSize: 22, color: colors.text.primary },
    subtitle: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, marginTop: -spacing.xs },
    step: { flexDirection: "row", gap: spacing.md, padding: spacing.sm, borderRadius: radii.lg },
    stepCurrent: { backgroundColor: colors.surface.base },
    marker: {
      width: 28,
      height: 28,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.border.subtle,
    },
    markerDone: { backgroundColor: colors.state.successStrong, borderColor: colors.state.successStrong },
    markerCurrent: { backgroundColor: colors.brand.navy, borderColor: colors.brand.navy },
    markerNumber: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.secondary },
    markerNumberCurrent: { color: colors.text.onNavy },
    stepText: { flex: 1, gap: spacing.xs },
    stepTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    stepTitleDone: { color: colors.text.secondary, textDecorationLine: "line-through" },
    stepDescription: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    cta: { marginTop: spacing.xs },
  }),
);
