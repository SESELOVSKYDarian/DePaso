import { PAYMENT_METHODS } from "@depaso/domain";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { paymentsClient } from "@/lib/apiClient";

const GROUPS = [
  { group: "WALLET", title: "Billeteras" },
  { group: "CARD", title: "Tarjetas" },
] as const;

/** El usuario marca con qué paga; el Top 3 descuenta las promos que le corresponden. */
export default function PaymentMethodsScreen() {
  const { show: showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    paymentsClient
      .getMethods()
      .then(({ methods }) => setSelected(methods))
      .catch(() => showToast("No pudimos cargar tus medios de pago.", "error"))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const toggle = (slug: string) =>
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await paymentsClient.setMethods(selected);
      showToast("Medios de pago guardados", "success");
      router.back();
    } catch {
      showToast("No pudimos guardar. Probá de nuevo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.navy} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Elegí con qué pagás. Cuando armemos tu Top 3 vamos a descontar las promociones de esos medios de pago en cada
        comercio, según el día. Las promos son informativas: confirmá condiciones y tope en el comercio.
      </Text>

      {GROUPS.map(({ group, title }) => (
        <View key={group} style={styles.group}>
          <Text style={styles.groupTitle}>{title}</Text>
          {PAYMENT_METHODS.filter((method) => method.group === group).map((method) => {
            const isOn = selected.includes(method.slug);
            return (
              <AnimatedPressable
                key={method.slug}
                accessibilityLabel={method.label}
                haptic={false}
                onPress={() => toggle(method.slug)}
                style={[styles.row, isOn ? styles.rowOn : null]}
              >
                <Text style={[styles.rowLabel, isOn ? styles.rowLabelOn : null]}>{method.label}</Text>
                <Text style={styles.check}>{isOn ? "✓" : ""}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
      ))}

      <Button label={isSaving ? "Guardando..." : "Guardar"} onPress={() => void handleSave()} loading={isSaving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  intro: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  group: { gap: spacing.xs },
  groupTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  rowOn: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
  rowLabel: { fontFamily: typography.body.fontFamily, fontSize: 15, color: colors.text.primary },
  rowLabelOn: { fontWeight: "600" },
  check: { fontSize: 18, color: colors.brand.navy },
});
