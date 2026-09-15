import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ProgressHeader } from "@/components/ProgressHeader";
import { SelectCheckbox } from "@/components/SelectCheckbox";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import type { PlaceType } from "@depaso/types";

const SUGGESTED_TYPES: PlaceType[] = ["HOME", "WORK", "STUDY", "GYM"];

const TYPE_ICON: Record<PlaceType, keyof typeof Ionicons.glyphMap> = {
  HOME: "home-outline",
  WORK: "briefcase-outline",
  STUDY: "school-outline",
  GYM: "barbell-outline",
  FAMILY: "people-outline",
  CUSTOM: "location-outline",
};

/**
 * Lugares habituales (depaso-lugares-habituales en Figma). A diferencia del resto de los
 * pasos de setup, éste sí es funcionalidad real (Fase 6, `usePlaces`/`placesClient` ya
 * existen): cada fila navega al form real de `places/form` con el tipo precargado, y el
 * check se calcula según lo que el usuario ya tenga guardado.
 */
export default function PlacesSetupScreen() {
  const { places } = usePlaces();

  const goNext = () => router.push("/(setup)/interests");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.85} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tus lugares habituales</Text>
        <Text style={styles.subtitle}>Agregá los lugares que más frecuentás. Podrás agregar más tarde.</Text>

        <View style={styles.list}>
          {SUGGESTED_TYPES.map((type) => {
            const meta = PLACE_TYPE_META[type];
            const saved = places.find((p) => p.type === type);
            return (
              <AnimatedPressable
                key={type}
                accessibilityLabel={`Agregar ${meta.label}`}
                haptic={false}
                onPress={() => router.push({ pathname: "/(setup)/places-form", params: { type } })}
                style={[styles.row, saved ? styles.rowSelected : null]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={TYPE_ICON[type]} size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{meta.label}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {saved ? saved.address : "Mar del Plata, Buenos Aires"}
                  </Text>
                </View>
                <SelectCheckbox checked={saved !== undefined} />
              </AnimatedPressable>
            );
          })}

          <AnimatedPressable
            accessibilityLabel="Agregar otro lugar"
            haptic={false}
            onPress={() => router.push("/(setup)/places-form")}
            style={styles.row}
          >
            <View style={[styles.iconCircle, styles.iconCircleAdd]}>
              <Ionicons name="add" size={20} color={colors.text.onLime} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Otro lugar</Text>
              <Text style={styles.rowValue}>Agregar un lugar</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </AnimatedPressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable accessibilityLabel="Continuar" onPress={goNext} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Continuar</Text>
        </AnimatedPressable>
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
    lineHeight: 20,
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
  rowSelected: {
    backgroundColor: colors.surface.input,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleAdd: {
    backgroundColor: colors.brand.accent,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  rowValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
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
