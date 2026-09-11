import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import type { PlaceType } from "@depaso/types";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { PLACE_TYPES, PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const results = await Location.geocodeAsync(address);
  const first = results[0];
  return first ? { latitude: first.latitude, longitude: first.longitude } : null;
}

export default function PlaceFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { places, createPlace, updatePlace, removePlace } = usePlaces();
  const existing = useMemo(() => places.find((p) => p.id === id), [places, id]);
  const isEditing = existing !== undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<PlaceType>(existing?.type ?? "CUSTOM");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [addressError, setAddressError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddressError("No pudimos acceder a tu ubicación — dale permiso o escribí la dirección.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (place) {
        const parts = [place.street, place.streetNumber, place.city].filter(Boolean);
        setAddress(parts.join(" ") || `${position.coords.latitude}, ${position.coords.longitude}`);
        setAddressError(undefined);
      }
    } catch {
      setAddressError("No pudimos obtener tu ubicación actual.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    let hasError = false;
    if (!name.trim()) {
      setNameError("Ponele un nombre a este lugar.");
      hasError = true;
    } else {
      setNameError(undefined);
    }
    if (!address.trim()) {
      setAddressError("Ingresá una dirección o usá tu ubicación actual.");
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    try {
      const coords = await geocodeAddress(address);
      if (!coords) {
        setAddressError("No pudimos ubicar esa dirección — probá ser más específico.");
        return;
      }
      setAddressError(undefined);

      if (isEditing) {
        await updatePlace(existing.id, { name, type, address, isFavorite, ...coords });
      } else {
        await createPlace({ name, type, address, isFavorite, ...coords });
      }
      router.back();
    } catch {
      setAddressError("No pudimos guardar el lugar. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setIsSubmitting(true);
    try {
      await removePlace(existing.id);
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField label="Nombre" value={name} onChangeText={setName} placeholder="Casa, Trabajo, Gimnasio..." error={nameError} />

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.typeRow}>
          {PLACE_TYPES.map((t) => {
            const meta = PLACE_TYPE_META[t];
            const selected = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={meta.label}
                style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
              >
                <Text style={styles.typeEmoji}>{meta.emoji}</Text>
                <Text style={[styles.typeLabel, selected ? styles.typeLabelSelected : null]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <FormField
          label="Dirección"
          value={address}
          onChangeText={setAddress}
          placeholder="Calle y altura, barrio"
          error={addressError}
        />
        <AnimatedPressable
          accessibilityLabel="Usar mi ubicación actual"
          haptic={false}
          onPress={() => void handleUseCurrentLocation()}
          style={styles.locationButton}
        >
          <Text style={styles.locationLabel}>
            {isLocating ? "Buscando tu ubicación..." : "📍 Usar mi ubicación actual"}
          </Text>
        </AnimatedPressable>

        <View style={styles.favoriteRow}>
          <Checkbox checked={isFavorite} onToggle={setIsFavorite} accessibilityLabel="Marcar como favorito">
            <Text style={styles.checkboxLabel}>Favorito</Text>
          </Checkbox>
        </View>

        <AnimatedPressable
          accessibilityLabel={isEditing ? "Guardar cambios" : "Guardar lugar"}
          onPress={() => void handleSubmit()}
          style={styles.submitButton}
        >
          <Text style={styles.submitLabel}>{isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar lugar"}</Text>
        </AnimatedPressable>

        {isEditing ? (
          <AnimatedPressable
            accessibilityLabel="Eliminar lugar"
            onPress={() => void handleDelete()}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteLabel}>Eliminar lugar</Text>
          </AnimatedPressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    padding: spacing.lg,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
  },
  typeChipSelected: {
    backgroundColor: colors.brand.mint,
    borderColor: colors.brand.navy,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  typeLabelSelected: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  locationButton: {
    alignSelf: "flex-start",
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  locationLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand.route,
  },
  favoriteRow: {
    marginBottom: spacing.lg,
  },
  checkboxLabel: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  submitLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
  deleteButton: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.state.error,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  deleteLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.state.error,
  },
});
