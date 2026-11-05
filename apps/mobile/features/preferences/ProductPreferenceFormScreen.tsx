import type { ProductPreferenceInput, ProductSearchResult } from "@depaso/validation";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { preferencesClient } from "@/lib/apiClient";
import { makeStyles } from "@/lib/theme";
import { PreferenceTypeOptions } from "./components/PreferenceTypeOptions";
import { ProductFinder } from "./components/ProductFinder";

type Type = ProductPreferenceInput["type"];

/**
 * Preferencia de marca para un producto. Se busca el producto exacto con las cajas de categorías o
 * escribiendo; si no está en el catálogo, se puede nombrar a mano.
 */
export default function ProductPreferenceFormScreen() {
  const styles = useStyles();
  const { show: showToast } = useToast();
  const [selected, setSelected] = useState<ProductSearchResult | null>(null);
  // "nombrarlo": el producto no está en el catálogo
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [type, setType] = useState<Type>("PREFERRED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
    if (naming && name.trim().length < 2) {
      setNameError("Escribí cómo se llama el producto.");
      return;
    }
    if (!naming && !selected) return;
    setIsSubmitting(true);
    try {
      if (naming) await preferencesClient.customProducts.create({ name: name.trim(), type });
      else await preferencesClient.products.set({ productId: selected!.id, type });
      router.back();
    } catch {
      showToast("No pudimos guardar la preferencia.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1) buscar el producto
  if (!selected && !naming) {
    return (
      <View style={styles.container}>
        <ProductFinder
          onPick={setSelected}
          footer={<Button label="No lo encuentro: escribirlo yo" variant="secondary" onPress={() => setNaming(true)} />}
        />
      </View>
    );
  }

  // 2) qué tan estricta es la preferencia (con el producto elegido, o con el nombre escrito)
  return (
    <View style={styles.container}>
      {naming ? (
        <FormField
          label="¿Cómo se llama el producto?"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
          }}
          placeholder="Ej.: Yerba Playadito 1 kg"
          autoCapitalize="sentences"
          maxLength={120}
          error={nameError}
          hint="Queda anotado para vos. Todavía no lo tenemos en el catálogo, así que no entra en la comparación de precios."
        />
      ) : (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>{selected!.name}</Text>
          <Text style={styles.selectedMeta}>{selected!.category}</Text>
        </View>
      )}

      <Text style={styles.label}>¿Qué tan estricta es tu preferencia?</Text>
      <PreferenceTypeOptions value={type} onChange={setType} />

      <Button label={isSubmitting ? "Guardando..." : "Guardar preferencia"} onPress={() => void save()} loading={isSubmitting} />
      <Button
        label={naming ? "Buscarlo en el catálogo" : "Elegir otro producto"}
        variant="ghost"
        onPress={() => {
          setSelected(null);
          setNaming(false);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    selectedCard: { backgroundColor: colors.surface.primary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing.md },
    selectedTitle: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 16, color: colors.text.primary },
    selectedMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.muted, marginTop: 1 },
    label: { fontFamily: typography.caption.fontFamily, fontSize: 13, fontWeight: "600", color: colors.text.secondary },
  }),
);