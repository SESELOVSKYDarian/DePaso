import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TextInput, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";
import type { Facets } from "../types";

interface MerchantFiltersProps {
  query: string;
  onChangeQuery: (text: string) => void;
  facets: Facets;
  typeId: string | null;
  brandId: string | null;
  /** Hay texto o filtros activos: muestra las marcas y el botón de limpiar. */
  hasFilters: boolean;
  hasText: boolean;
  onPickType: (id: string | null) => void;
  onPickBrand: (id: string | null) => void;
  onClear: () => void;
}

/** Buscador, chips de tipo, chips de marca y "Limpiar filtros" de la lista de precios. */
export function MerchantFilters(props: MerchantFiltersProps) {
  const colors = useColors();
  const styles = useStyles();
  const { query, facets, typeId, brandId } = props;

  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.text.secondary} />
        <TextInput
          value={query}
          onChangeText={props.onChangeQuery}
          placeholder="Buscar en tus productos"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Buscar en tus productos"
          style={styles.searchInput}
        />
        {query ? (
          <AnimatedPressable accessibilityLabel="Borrar búsqueda" haptic={false} onPress={() => props.onChangeQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </AnimatedPressable>
        ) : null}
      </View>

      {facets.types.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {facets.types.map((type) => {
            const selected = typeId === type.id;
            return (
              <AnimatedPressable
                key={type.id}
                accessibilityLabel={`${selected ? "Quitar filtro" : "Filtrar por"} ${type.label}`}
                haptic={false}
                onPress={() => props.onPickType(selected ? null : type.id)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                  {type.label} · {type.count}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {facets.brands.length > 0 && (typeId || props.hasText) ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {facets.brands.map((brand) => {
            const selected = brandId === brand.id;
            return (
              <AnimatedPressable
                key={brand.id}
                accessibilityLabel={`${selected ? "Quitar marca" : "Marca"} ${brand.name}`}
                haptic={false}
                onPress={() => props.onPickBrand(selected ? null : brand.id)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{brand.name}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {props.hasFilters ? (
        <AnimatedPressable accessibilityLabel="Limpiar búsqueda y filtros" haptic={false} onPress={props.onClear} style={styles.clear}>
          <Text style={styles.clearLabel}>Limpiar filtros</Text>
        </AnimatedPressable>
      ) : null}
    </>
  );
}
