import { AD_PRICE_PER_DAY, type AdKind, type AdPrices } from "@depaso/validation";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { InfoButton } from "@/components/common/InfoButton";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { adsClient } from "@/lib/apiClient";
import { makeStyles, useColors } from "@/lib/theme";

const KINDS: { kind: AdKind; label: string }[] = [
  { kind: "FEATURED_PRODUCT", label: "Producto destacado" },
  { kind: "BANNER", label: "Banner abajo" },
  { kind: "IMAGE", label: "Imagen" },
  { kind: "VIDEO", label: "Video" },
];

/** El administrador fija cuánto cuesta por día cada formato de publicidad. */
export function AdPricesCard() {
  const styles = useStyles();
  const colors = useColors();
  const { show: showToast } = useToast();
  // plegada por defecto: se abre solo cuando hay que cambiar un precio
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<AdKind, string>>({
    FEATURED_PRODUCT: String(AD_PRICE_PER_DAY.FEATURED_PRODUCT),
    BANNER: String(AD_PRICE_PER_DAY.BANNER),
    IMAGE: String(AD_PRICE_PER_DAY.IMAGE),
    VIDEO: String(AD_PRICE_PER_DAY.VIDEO),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adsClient
      .prices()
      .then((prices) => setValues({ FEATURED_PRODUCT: String(prices.FEATURED_PRODUCT), BANNER: String(prices.BANNER), IMAGE: String(prices.IMAGE), VIDEO: String(prices.VIDEO) }))
      .catch(() => showToast("No pudimos cargar los precios.", "error"));
  }, [showToast]);

  const save = async () => {
    const parsed = {} as AdPrices;
    for (const { kind, label } of KINDS) {
      const amount = Number(values[kind].replace(/\./g, "").replace(",", "."));
      if (!Number.isInteger(amount) || amount < 0) {
        showToast(`El precio de "${label}" tiene que ser un número entero.`, "error");
        return;
      }
      parsed[kind] = amount;
    }
    setSaving(true);
    try {
      await adsClient.admin.setPrices(parsed);
      showToast("Precios guardados. Los comercios ya ven los nuevos.", "success");
    } catch {
      showToast("No pudimos guardar los precios.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AnimatedPressable accessibilityLabel={open ? "Cerrar precios base" : "Abrir precios base"} haptic={false} onPress={() => setOpen((current) => !current)} style={styles.headButton}>
          <Text style={styles.title}>Precio base por día</Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.text.secondary} />
        </AnimatedPressable>
        <InfoButton title="Precio base por día" lines={["Lo que cuesta cada formato por día. Los comercios nunca pueden ofrecer menos que esto multiplicado por los días."]} />
      </View>
      {open ? (
        <>
          {KINDS.map(({ kind, label }) => (
            <FormField
              key={kind}
              label={`${label} (pesos por día)`}
              value={values[kind]}
              onChangeText={(text) => setValues((current) => ({ ...current, [kind]: text }))}
              keyboardType="numeric"
            />
          ))}
          <Button label={saving ? "Guardando…" : "Guardar precios"} onPress={() => void save()} loading={saving} />
        </>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headButton: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 40 },
  }),
);
