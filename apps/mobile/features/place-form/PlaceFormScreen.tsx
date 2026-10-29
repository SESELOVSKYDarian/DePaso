import { ApiError } from "@depaso/api-client";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PlaceType } from "@depaso/types";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Checkbox } from "@/components/common/Checkbox";
import { FormField } from "@/components/common/FormField";
import type { PlaceSuggestionResponse } from "@depaso/validation";
import { PlaceSearchBox } from "@/components/map/PlaceSearchBox";
import { geocodeClient } from "@/lib/apiClient";
import { PLACE_TYPES, PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useStyles } from "./styles";
import { GEOCODING_NOT_CONFIGURED_MESSAGE, geocodeAddress } from "./helpers";

export default function PlaceFormScreen() {
  const styles = useStyles();
  const { id, type: presetType } = useLocalSearchParams<{ id?: string; type?: PlaceType }>();
  const { places, createPlace, updatePlace, removePlace } = usePlaces();
  const existing = useMemo(() => places.find((p) => p.id === id), [places, id]);
  const isEditing = existing !== undefined;

  const [name, setName] = useState(existing?.name ?? (presetType ? PLACE_TYPE_META[presetType].label : ""));
  const [type, setType] = useState<PlaceType>(existing?.type ?? presetType ?? "CUSTOM");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [addressError, setAddressError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  // Coordenadas ya conocidas (del buscador, del GPS o del lugar que se edita): si están, no hace
  // falta volver a ubicar la dirección al guardar. Si se escribe a mano la dirección, se borran.
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    existing ? { latitude: existing.latitude, longitude: existing.longitude } : null,
  );

  // eligió un resultado del buscador: completa la dirección (y el nombre, si estaba vacío)
  const handlePickResult = (place: PlaceSuggestionResponse) => {
    const text = place.kind === "poi" ? place.address || place.name : [place.name, place.address].filter(Boolean).join(", ");
    setAddress(text);
    setAddressError(undefined);
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    if (!name.trim() && place.kind === "poi") setName(place.name);
  };

  // pide permiso de ubicación y usa el GPS para completar la dirección
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddressError("No pudimos acceder a tu ubicación — dale permiso o escribí la dirección.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      try {
        const { address: resolved } = await geocodeClient.reverse({ latitude, longitude });
        setAddress(resolved);
        setCoords({ latitude, longitude });
        setAddressError(undefined);
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          setAddress(`${latitude}, ${longitude}`);
          setAddressError(GEOCODING_NOT_CONFIGURED_MESSAGE);
        } else {
          setAddress(`${latitude}, ${longitude}`);
        }
      }
    } catch {
      setAddressError("No pudimos obtener tu ubicación actual.");
    } finally {
      setIsLocating(false);
    }
  };

  // valida los campos y guarda el lugar
  const handleSubmit = async () => {
    if (isSubmitting) return;
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
      const resolved = coords ?? (await geocodeAddress(address));
      if (!resolved) {
        setAddressError("No pudimos ubicar esa dirección — probá ser más específico.");
        return;
      }
      setAddressError(undefined);

      if (isEditing) {
        await updatePlace(existing.id, { name, type, address, isFavorite, ...resolved });
      } else {
        await createPlace({ name, type, address, isFavorite, ...resolved });
      }
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setAddressError(GEOCODING_NOT_CONFIGURED_MESSAGE);
      } else if (err instanceof ApiError) {
        setAddressError("No pudimos guardar el lugar. Probá de nuevo.");
      } else {
        // Error de red/conexión, no de la API — mismo criterio que route-context/index.tsx:
        // no mostrar el mismo mensaje que un error real del servidor.
        setAddressError("No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // elimina el lugar que se está editando
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

        <Text style={styles.label}>Buscar el lugar</Text>
        <PlaceSearchBox onSelect={handlePickResult} placeholder="Shell, Técnica 5, Colón 1234…" style={styles.searchBox} />

        <FormField
          label="Dirección"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            setCoords(null);
          }}
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
