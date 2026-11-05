import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { PlaceSearchBox } from "@/components/map/PlaceSearchBox";
import { ExploreMap } from "@/features/map/components/ExploreMap";
import { useMapSearch } from "@/features/map/useMapSearch";
import { useMapToken } from "@/features/map/useMapToken";
import { preferencesClient } from "@/lib/apiClient";
import { makeStyles } from "@/lib/theme";

/**
 * Agregar a mano un comercio que no está en la lista: se le pone nombre y se marca dónde queda
 * en el mapa (tocándolo o con el buscador). Llega con la categoría y el tipo ya elegidos.
 */
export default function CustomStoreScreen() {
  const styles = useStyles();
  const { show: showToast } = useToast();
  const { category, type } = useLocalSearchParams<{ category?: string; type?: "REQUIRED" | "PREFERRED" }>();
  const token = useMapToken();
  const search = useMapSearch();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { place } = search;

  const save = async () => {
    if (name.trim().length < 2) {
      setNameError("Escribí el nombre del comercio.");
      return;
    }
    if (!place) {
      showToast("Marcá en el mapa dónde queda el comercio.", "info");
      return;
    }
    setIsSaving(true);
    try {
      await preferencesClient.customStores.create({
        category: category ?? "",
        type: type ?? "PREFERRED",
        name: name.trim(),
        ...(place.kind !== "point" || !place.address.startsWith("Buscando") ? { address: place.address } : {}),
        latitude: place.latitude,
        longitude: place.longitude,
      });
      showToast("Comercio agregado.", "success");
      router.dismissTo("/preferences");
    } catch {
      showToast("No pudimos guardar el comercio. Probá de nuevo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.top}>
        <FormField
          label="Nombre del comercio"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
          }}
          placeholder="Ej.: Carnicería Don Pepe"
          autoCapitalize="words"
          maxLength={120}
          error={nameError}
        />
      </View>

      <View style={styles.mapArea}>
        <ExploreMap token={token} onPick={(point) => void search.choosePoint(point)} focus={search.focus} userLocation={search.userLocation} placePin={search.pinFocus} />
        <View style={styles.searchLayer}>
          <PlaceSearchBox near={search.userLocation} onSelect={search.chooseResult} placeholder="Buscar la dirección o tocar el mapa" />
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.address} numberOfLines={2}>
          {place ? place.address : "Tocá el mapa para marcar dónde queda."}
        </Text>
        <Button label={isSaving ? "Guardando..." : "Guardar comercio"} onPress={() => void save()} loading={isSaving} disabled={!place} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    top: { padding: spacing.lg, paddingBottom: spacing.sm },
    mapArea: { flex: 1, minHeight: 260, marginHorizontal: spacing.lg, borderRadius: radii.xl, overflow: "hidden" },
    searchLayer: { position: "absolute", top: spacing.sm, left: spacing.sm, right: spacing.sm, zIndex: 30 },
    bottom: { padding: spacing.lg, gap: spacing.sm },
    address: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
  }),
);