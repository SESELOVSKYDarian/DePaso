import { Ionicons } from "@expo/vector-icons";
import type { PlaceSuggestionResponse } from "@depaso/validation";
import { useState, type ComponentProps } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { usePlaceSearch } from "@/lib/places/usePlaceSearch";
import { makeStyles, useColors } from "@/lib/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Ícono de cada tipo de resultado: comercio, calle, barrio o ciudad. */
const KIND_ICONS: Record<PlaceSuggestionResponse["kind"], IconName> = {
  poi: "storefront-outline",
  address: "location-outline",
  neighborhood: "map-outline",
  place: "business-outline",
};

interface PlaceSearchBoxProps {
  /** Posición del usuario (si se sabe): los resultados más cercanos salen primero. */
  near?: { latitude: number; longitude: number } | null;
  /** Se llama al elegir un resultado de la lista. */
  onSelect: (place: PlaceSuggestionResponse) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Buscador de lugares con sugerencias mientras se escribe, como el de Google Maps: "Shell",
 * "Técnica 5", "Colón 1234". Al elegir un resultado se avisa con `onSelect` y la lista se cierra.
 */
export function PlaceSearchBox({ near, onSelect, placeholder = "Buscar un lugar o una dirección", autoFocus, style }: PlaceSearchBoxProps) {
  const styles = useStyles();
  const colors = useColors();
  const [query, setQuery] = useState("");
  // La lista se cierra al elegir un resultado y se vuelve a abrir al seguir escribiendo.
  const [open, setOpen] = useState(true);
  // con la lista cerrada (ya se eligió un resultado) no se vuelve a buscar
  const search = usePlaceSearch(open ? query : "", near);

  const choose = (place: PlaceSuggestionResponse) => {
    setQuery(place.name);
    setOpen(false);
    onSelect(place);
  };

  const showList = open && search.hasQuery;

  return (
    <View style={style}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.text.secondary} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setOpen(true);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          autoFocus={autoFocus}
          selectTextOnFocus
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Buscar un lugar"
          style={styles.input}
        />
        {search.isSearching ? <ActivityIndicator size="small" color={colors.text.secondary} /> : null}
        {query.length > 0 ? (
          <AnimatedPressable accessibilityLabel="Borrar la búsqueda" haptic={false} onPress={() => { setQuery(""); setOpen(true); }}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </AnimatedPressable>
        ) : null}
      </View>

      {showList ? (
        <View style={styles.list}>
          {search.failed ? (
            <Text style={styles.message}>No pudimos buscar. Revisá tu conexión e intentá de nuevo.</Text>
          ) : search.results.length === 0 && !search.isSearching ? (
            <Text style={styles.message}>No encontramos ese lugar. Probá con otro nombre o con la calle y el número.</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
              {search.results.map((place) => (
                <AnimatedPressable
                  key={place.id}
                  accessibilityLabel={`${place.name}, ${place.address}`}
                  haptic={false}
                  onPress={() => choose(place)}
                  style={styles.row}
                >
                  <Ionicons name={KIND_ICONS[place.kind]} size={20} color={colors.text.secondary} />
                  <View style={styles.rowText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {place.name}
                    </Text>
                    {place.address ? (
                      <Text style={styles.address} numberOfLines={1}>
                        {place.address}
                      </Text>
                    ) : null}
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    input: {
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
      paddingVertical: spacing.sm,
      // en la web, sin el recuadro blanco que el navegador pone al enfocar
      ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
    },
    list: {
      marginTop: spacing.xs,
      borderRadius: radii.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    scroll: { maxHeight: 300 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    rowText: { flex: 1 },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    address: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary, marginTop: 1 },
    message: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      padding: spacing.md,
    },
  }),
);
