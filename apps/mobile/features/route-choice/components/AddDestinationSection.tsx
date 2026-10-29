import { Ionicons } from "@expo/vector-icons";
import type { UserPlaceResponse } from "@depaso/validation";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { makeStyles, useColors } from "@/lib/theme";

/** "Agregar destino": un buscador que lleva a Armar ruta y atajos con tus lugares guardados. */
export function AddDestinationSection({ places }: { places: UserPlaceResponse[] }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Agregar destino
      </Text>
      <AnimatedPressable
        accessibilityLabel="Buscar un lugar para armar una ruta"
        haptic={false}
        onPress={() => router.push("/route-builder")}
        style={styles.search}
      >
        <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
        <Text style={styles.searchText}>Buscar un lugar…</Text>
      </AnimatedPressable>
      {places.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {places.map((place) => (
            <AnimatedPressable
              key={place.id}
              accessibilityLabel={`Armar una ruta con ${place.name}`}
              haptic={false}
              onPress={() => router.push({ pathname: "/route-builder", params: { addPlace: place.id } })}
              style={styles.chip}
            >
              <Text style={styles.chipEmoji}>{PLACE_TYPE_META[place.type].emoji}</Text>
              <Text style={styles.chipText}>{place.name}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    searchText: { fontFamily: typography.body.fontFamily, fontSize: 15, color: colors.text.tertiary },
    chips: { gap: spacing.sm },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      minHeight: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    chipEmoji: { fontSize: 16 },
    chipText: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
  }),
);
