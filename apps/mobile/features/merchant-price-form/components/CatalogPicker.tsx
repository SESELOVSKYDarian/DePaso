import type { ProductSearchResult } from "@depaso/validation";
import { StyleSheet, Text } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { FormField } from "@/components/common/FormField";
import { makeStyles } from "@/lib/theme";

interface CatalogPickerProps {
  query: string;
  onSearch: (text: string) => void;
  results: ProductSearchResult[];
  selectedVariantId: string | null;
  selectedLabel: string;
  onPick: (variantId: string, label: string) => void;
}

/** Buscador de productos del catálogo: se escribe, aparecen las presentaciones y se elige una. */
export function CatalogPicker({ query, onSearch, results, selectedVariantId, selectedLabel, onPick }: CatalogPickerProps) {
  const styles = useStyles();
  return (
    <>
      <FormField label="Buscar producto" value={query} onChangeText={onSearch} placeholder="Leche, yerba, coca..." />
      {selectedVariantId ? <Text style={styles.selected}>Elegido: {selectedLabel}</Text> : null}
      {results.map((product) =>
        product.variants.map((variant) => (
          <AnimatedPressable
            key={variant.id}
            accessibilityLabel={`Elegir ${variant.name}`}
            haptic={false}
            onPress={() => onPick(variant.id, variant.name)}
            style={[styles.row, selectedVariantId === variant.id ? styles.rowSelected : null]}
          >
            <Text style={styles.rowName}>{variant.name}</Text>
            <Text style={styles.rowMeta}>
              {product.category} · {variant.unitSize}
              {variant.unit}
            </Text>
          </AnimatedPressable>
        )),
      )}
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    selected: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary, fontWeight: "600" },
    row: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.sm,
      minHeight: 44,
    },
    rowSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
    rowName: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 14, color: colors.text.primary },
    rowMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.muted, marginTop: 1 },
  }),
);
