import { Ionicons } from "@expo/vector-icons";
import { PRODUCT_TYPE_LABELS } from "@depaso/domain";
import type { ProductFacets } from "@depaso/validation";
import { ScrollView, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface SearchFiltersProps {
  group: { id: string; label: string } | null;
  typeId: string | null;
  brand: { id: string; name: string } | null;
  facets: ProductFacets;
  /** `true` si se está buscando por texto (ahí se ofrecen los tipos que salieron) */
  isTyping: boolean;
  onGoHome: () => void;
  onGoGroup: () => void;
  onPickType: (id: string | null) => void;
  onClearBrand: () => void;
  onPickBrand: (brand: { id: string; name: string } | null) => void;
}

/** Migas de pan (Todo > Bebidas > Gaseosas), tipos para afinar y marcas disponibles. */
export function SearchFilters(props: SearchFiltersProps) {
  const colors = useColors();
  const styles = useStyles();
  const { group, typeId, brand, facets } = props;

  const crumbs: { label: string; onPress: () => void }[] = [];
  if (group || typeId) crumbs.push({ label: "Todo", onPress: props.onGoHome });
  if (group) crumbs.push({ label: group.label, onPress: props.onGoGroup });
  if (typeId) crumbs.push({ label: PRODUCT_TYPE_LABELS[typeId] ?? typeId, onPress: props.onClearBrand });
  if (brand) crumbs.push({ label: brand.name, onPress: () => undefined });

  const typeOptions = props.isTyping ? facets.types.map((t) => ({ id: t.id, label: t.label })) : [];

  return (
    <View style={styles.headerBlock}>
      {crumbs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
          {crumbs.map((crumb, index) => (
            <View key={crumb.label} style={styles.crumbItem}>
              {index > 0 ? <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} /> : null}
              <AnimatedPressable accessibilityLabel={`Ir a ${crumb.label}`} haptic={false} onPress={crumb.onPress}>
                <Text style={[styles.crumb, index === crumbs.length - 1 ? styles.crumbCurrent : null]}>{crumb.label}</Text>
              </AnimatedPressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {typeOptions.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipRow}>
          {typeOptions.map((type) => {
            const selected = typeId === type.id;
            return (
              <AnimatedPressable
                key={type.id}
                accessibilityLabel={`${selected ? "Quitar filtro" : "Filtrar por"} ${type.label}`}
                haptic={false}
                onPress={() => props.onPickType(selected ? null : type.id)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{type.label}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {typeId && facets.brands.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Marcas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipRow}>
            {[{ id: "", name: "Todas", count: 0 }, ...facets.brands].map((option) => {
              const selected = option.id === "" ? brand === null : brand?.id === option.id;
              return (
                <AnimatedPressable
                  key={option.id || "all"}
                  accessibilityLabel={option.id ? `Marca ${option.name}` : "Todas las marcas"}
                  haptic={false}
                  onPress={() => props.onPickBrand(option.id ? { id: option.id, name: option.name } : null)}
                  style={[styles.brandBox, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.brandName, selected ? styles.chipLabelSelected : null]} numberOfLines={1}>
                    {option.name}
                  </Text>
                  {option.count > 0 ? <Text style={[styles.brandCount, selected ? styles.chipLabelSelected : null]}>{option.count}</Text> : null}
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}
