import type { StoreBranchResponse, StorePreferenceInput } from "@depaso/validation";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { preferencesClient, storesClient } from "@/lib/apiClient";

const TYPE_OPTIONS: { value: StorePreferenceInput["type"]; label: string; hint: string }[] = [
  { value: "REQUIRED", label: "Obligatorio", hint: "Se fija este comercio antes de rankear (restricción obligatoria)." },
  { value: "PREFERRED", label: "Preferido", hint: "Suma puntos, pero DePaso puede sugerir otro si conviene mucho más." },
];

/** Elegir una categoría, un comercio/sucursal y qué tan estricta es la preferencia (Fase 10). */
export default function StorePreferenceFormScreen() {
  const { show: showToast } = useToast();
  const [category, setCategory] = useState("");
  const [type, setType] = useState<StorePreferenceInput["type"]>("PREFERRED");
  const [branches, setBranches] = useState<StoreBranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    storesClient
      .listBranches()
      .then(({ branches: fetched }) => setBranches(fetched))
      .catch(() => showToast("No pudimos cargar los comercios.", "error"))
      .finally(() => setIsLoadingBranches(false));
  }, [showToast]);

  const handleSave = async () => {
    if (!category.trim()) {
      setCategoryError("Decinos para qué categoría es esta preferencia (ej. Carnicería).");
      return;
    }
    if (!selectedBranchId) return;
    setIsSubmitting(true);
    try {
      await preferencesClient.stores.set({ category: category.trim(), type, storeBranchId: selectedBranchId });
      router.back();
    } catch {
      showToast("No pudimos guardar la preferencia.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <FormField
        label="Categoría"
        value={category}
        onChangeText={(text) => {
          setCategory(text);
          setCategoryError(undefined);
        }}
        placeholder="Carnicería, Verdulería, Almacén..."
        error={categoryError}
      />

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

      <Text style={styles.label}>Comercio</Text>
      {isLoadingBranches ? (
        <Text style={styles.rowMeta}>Cargando comercios...</Text>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(item) => item.id}
          style={styles.branchList}
          renderItem={({ item }) => (
            <AnimatedPressable
              accessibilityLabel={`Elegir ${item.storeName} - ${item.name}`}
              haptic={false}
              onPress={() => setSelectedBranchId(item.id)}
              style={[styles.row, selectedBranchId === item.id ? styles.rowSelected : null]}
            >
              <Text style={styles.rowName}>{item.storeName}</Text>
              <Text style={styles.rowMeta}>
                {item.name} · {item.address}
              </Text>
            </AnimatedPressable>
          )}
        />
      )}

      <Button
        label={isSubmitting ? "Guardando..." : "Guardar preferencia"}
        onPress={() => void handleSave()}
        disabled={!selectedBranchId}
        loading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  options: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
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
  branchList: {
    maxHeight: 220,
    marginBottom: spacing.sm,
  },
  row: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    minHeight: 44,
    marginBottom: spacing.xs,
  },
  rowSelected: {
    borderColor: colors.brand.navy,
    backgroundColor: colors.brand.mint,
  },
  rowName: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 14,
    color: colors.text.primary,
  },
  rowMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
});
