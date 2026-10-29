import { ScrollView, StyleSheet, Text } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { makeStyles } from "@/lib/theme";
import { CatalogPicker } from "./components/CatalogPicker";
import { ModeTabs } from "./components/ModeTabs";
import { NewProductFields } from "./components/NewProductFields";
import { useMerchantPriceForm } from "./useMerchantPriceForm";

/**
 * Formulario de precios del comercio: editar o dar de baja un precio, publicar un producto del
 * catálogo o crear uno nuevo. La lógica está en `useMerchantPriceForm`; acá solo se dibuja.
 */
export default function MerchantPriceFormScreen() {
  const styles = useStyles();
  const form = useMerchantPriceForm();
  const { catalog, fresh } = form;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {form.isEditing ? (
        <>
          <Text style={styles.title}>{form.editingName}</Text>
          <FormField
            label="Nombre en tu góndola (opcional)"
            value={form.displayName}
            onChangeText={form.setDisplayName}
            placeholder="Cómo lo llamás vos, si el de arriba no se entiende"
            autoCapitalize="sentences"
          />
          <Text style={styles.hint}>Sólo cambia en tu comercio: el nombre del catálogo queda igual para los demás.</Text>
        </>
      ) : (
        <ModeTabs mode={form.mode} onChange={form.setMode} />
      )}

      {!form.isEditing && form.mode === "catalog" ? (
        <CatalogPicker
          query={catalog.query}
          onSearch={catalog.search}
          results={catalog.results}
          selectedVariantId={catalog.selectedVariantId}
          selectedLabel={catalog.selectedLabel}
          onPick={catalog.pickVariant}
        />
      ) : null}

      {!form.isEditing && form.mode === "new" ? (
        <NewProductFields
          name={fresh.name}
          onChangeName={fresh.setName}
          category={fresh.category}
          onChangeCategory={fresh.setCategory}
          brandName={fresh.brandName}
          onChangeBrandName={fresh.setBrandName}
          unit={fresh.unit}
          onChangeUnit={fresh.setUnit}
          unitSizeText={fresh.unitSizeText}
          onChangeUnitSize={fresh.setUnitSizeText}
          error={fresh.error}
        />
      ) : null}

      <FormField label="Precio (ARS)" value={form.priceText} onChangeText={form.changePrice} keyboardType="decimal-pad" error={form.priceError} />

      <Button label={form.isSubmitting ? "Guardando..." : "Guardar"} onPress={() => void form.save()} loading={form.isSubmitting} />
      {form.isEditing ? <Button label="Dar de baja" variant="danger" onPress={() => void form.remove()} disabled={form.isSubmitting} /> : null}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 20, color: colors.text.primary },
    hint: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: -spacing.xs },
  }),
);
