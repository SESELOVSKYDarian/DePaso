import type { ProductPreferenceInput, ProductSearchResult } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { preferencesClient, productsClient } from "@/lib/apiClient";

const TYPE_OPTIONS: { value: ProductPreferenceInput["type"]; label: string; hint: string }[] = [
  { value: "EXACT", label: "Marca exacta", hint: "Nunca la reemplaces por otra." },
  { value: "PREFERRED", label: "Marca preferida", hint: "Priorizala, pero puede cambiar si conviene mucho." },
  { value: "ANY", label: "Cualquier marca", hint: "Sin restricción — elegí siempre la más conveniente." },
];

/** Elegir un producto y decir qué tan estricta es la preferencia de marca (Fase 10). */
export default function ProductPreferenceFormScreen() {
  const { show: showToast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [selected, setSelected] = useState<ProductSearchResult | null>(null);
  const [type, setType] = useState<ProductPreferenceInput["type"]>("PREFERRED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const { results: found } = await productsClient.search(text.trim());
        setResults(found);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await preferencesClient.products.set({ productId: selected.id, type });
      router.back();
    } catch {
      showToast("No pudimos guardar la preferencia.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selected) {
    return (
      <View style={styles.container}>
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder="Buscar producto"
          placeholderTextColor={colors.text.muted}
          autoFocus
          autoCapitalize="none"
          style={styles.input}
        />
        {results.length === 0 ? (
          <EmptyState emoji="🔎" title="Buscá un producto" description="Escribí el nombre o la marca que querés configurar." />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <AnimatedPressable
                accessibilityLabel={`Elegir ${item.name}`}
                haptic={false}
                onPress={() => setSelected(item)}
                style={styles.row}
              >
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.category}</Text>
              </AnimatedPressable>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.selectedCard}>
        <Text style={styles.selectedTitle}>{selected.name}</Text>
        <Text style={styles.rowMeta}>{selected.category}</Text>
      </View>

      <Text style={styles.label}>¿Qué tan estricta es tu preferencia?</Text>
      <View style={styles.options}>
        {TYPE_OPTIONS.map((opt) => (
          <AnimatedPressable
            key={opt.value}
            accessibilityLabel={opt.label}
            haptic={false}
            onPress={() => setType(opt.value)}
            style={[styles.option, type === opt.value ? styles.optionSelected : null]}
          >
            <Text style={[styles.optionLabel, type === opt.value ? styles.optionLabelSelected : null]}>{opt.label}</Text>
            <Text style={styles.optionHint}>{opt.hint}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <Button label={isSubmitting ? "Guardando..." : "Guardar preferencia"} onPress={() => void handleSave()} loading={isSubmitting} />
      <Button label="Elegir otro producto" variant="ghost" onPress={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    padding: spacing.lg,
    gap: spacing.md,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.input,
    paddingHorizontal: spacing.md,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  list: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  row: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    minHeight: 44,
  },
  rowName: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.text.primary,
  },
  rowMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  selectedCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
  },
  selectedTitle: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.primary,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    padding: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.brand.navy,
    backgroundColor: colors.brand.mint,
  },
  optionLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 14,
    color: colors.text.primary,
  },
  optionLabelSelected: {
    color: colors.brand.navy,
  },
  optionHint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
