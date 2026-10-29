import { Ionicons } from "@expo/vector-icons";
import type { UserPlaceResponse } from "@depaso/validation";
import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { SelectCheckbox } from "@/components/common/SelectCheckbox";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface PlacesListProps {
  places: UserPlaceResponse[];
  selectedPlaceIds: Set<string | undefined>;
  isLocating: boolean;
  onToggle: (place: UserPlaceResponse) => void;
  onCurrentLocation: () => void;
  onPickOnMap: () => void;
  onAddToday: () => void;
}

/** "Mis lugares" con casilla para sumarlos al recorrido, más las formas de agregar otro punto. */
export function PlacesList(props: PlacesListProps) {
  const colors = useColors();
  const styles = useStyles();
  const { places, selectedPlaceIds, isLocating } = props;

  return (
    <>
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Mis lugares</Text>
        <Text style={styles.editLink} onPress={() => router.push("/places")}>
          Editar
        </Text>
      </View>
      <View style={styles.placesList}>
        {places.length === 0 ? (
          <Text style={styles.emptyHint}>
            Todavía no guardaste ningún lugar. Agregá el de hoy más abajo o guardá uno en Mis lugares.
          </Text>
        ) : (
          places.map((place) => {
            const checked = selectedPlaceIds.has(place.id);
            return (
              <AnimatedPressable
                key={place.id}
                accessibilityLabel={`${checked ? "Quitar" : "Agregar"} ${place.name} del recorrido de hoy`}
                haptic={false}
                onPress={() => props.onToggle(place)}
                style={[styles.placeRow, checked ? styles.placeRowSelected : null]}
              >
                <View style={styles.placeTile}>
                  <Text style={styles.placeEmoji}>{PLACE_TYPE_META[place.type].emoji}</Text>
                </View>
                <View style={styles.placeText}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>
                    {place.address}
                  </Text>
                </View>
                <SelectCheckbox checked={checked} />
              </AnimatedPressable>
            );
          })
        )}

        <AnimatedPressable
          accessibilityLabel="Agregar ubicación actual"
          haptic={false}
          onPress={props.onCurrentLocation}
          style={[styles.placeRow, isLocating ? styles.rowBusy : null]}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <Ionicons name="navigate-outline" size={18} color={colors.text.secondary} />
          )}
          <Text style={styles.placeName}>{isLocating ? "Buscando dónde estás…" : "Ubicación actual"}</Text>
        </AnimatedPressable>

        <AnimatedPressable accessibilityLabel="Elegir un lugar en el mapa" haptic={false} onPress={props.onPickOnMap} style={styles.placeRow}>
          <Ionicons name="map-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.placeName}>Elegir en el mapa</Text>
        </AnimatedPressable>

        <AnimatedPressable accessibilityLabel="Agregar lugar de hoy" onPress={props.onAddToday} style={styles.addStopRow}>
          <Ionicons name="add" size={16} color={colors.brand.route} />
          <Text style={styles.addStopLabel}>Agregar lugar de hoy</Text>
        </AnimatedPressable>
      </View>
    </>
  );
}
