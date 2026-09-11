import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import type { UserPlaceResponse } from "@depaso/validation";

function PlaceRow({ place }: { place: UserPlaceResponse }) {
  const meta = PLACE_TYPE_META[place.type];
  return (
    <AnimatedPressable
      accessibilityLabel={`Editar ${place.name}`}
      haptic={false}
      onPress={() => router.push({ pathname: "/places/form", params: { id: place.id } })}
      style={styles.row}
    >
      <Text style={styles.rowEmoji}>{meta.emoji}</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{place.name}</Text>
        <Text style={styles.rowAddress} numberOfLines={1}>
          {place.address}
        </Text>
      </View>
      {place.isFavorite ? <Text style={styles.favoriteStar}>★</Text> : null}
    </AnimatedPressable>
  );
}

export default function PlacesListScreen() {
  const { places, isLoading, error } = usePlaces();

  return (
    <View style={styles.container}>
      {isLoading && places.length === 0 ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={32} height={32} borderRadius={16} />
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <Skeleton width="50%" height={14} />
                <Skeleton width="80%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Algo salió mal" description={error} />
      ) : places.length === 0 ? (
        <EmptyState
          emoji="📍"
          title="Todavía no guardaste ningún lugar"
          description="Guardá Casa, Trabajo u otros lugares que visitás seguido para armar tu recorrido más rápido."
        />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlaceRow place={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <View style={styles.footer}>
        <AnimatedPressable
          accessibilityLabel="Agregar lugar"
          onPress={() => router.push("/places/form")}
          style={styles.addButton}
        >
          <Text style={styles.addLabel}>+ Agregar lugar</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    minHeight: 44,
  },
  rowEmoji: {
    fontSize: 24,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.text.primary,
  },
  rowAddress: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 1,
  },
  favoriteStar: {
    color: colors.saving.lime,
    fontSize: 18,
  },
  skeletonList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  addButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  addLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
});
