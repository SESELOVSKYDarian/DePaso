import { PAYMENT_METHODS } from "@depaso/domain";
import { spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { SelectionMark } from "@/components/SelectionMark";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { GroupedList, GroupedRow } from "@/components/GroupedList";
import { useToast } from "@/components/Toast";
import { paymentsClient } from "@/lib/apiClient";

const GROUPS = [
  { group: "WALLET", title: "Billeteras", icon: "wallet-outline" },
  { group: "CARD", title: "Tarjetas", icon: "card-outline" },
] as const;

/** El usuario marca con qué paga; el Top 3 descuenta las promos que le corresponden. */
export default function PaymentMethodsScreen() {
  const colors = useColors();
  const styles = useStyles();
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
        Elegí con qué pagás y descontamos esas promos en tu Top 3, según el comercio y el día.
      </Text>

      {GROUPS.map(({ group, title, icon }) => (
        <GroupedList key={group} title={title}>
          {PAYMENT_METHODS.filter((method) => method.group === group).map((method) => {
            const isOn = selected.includes(method.slug);
            return (
              <GroupedRow
                key={method.slug}
                icon={icon}
                label={method.label}
                accessibilityState={{ checked: isOn }}
                onPress={() => toggle(method.slug)}
                trailing={<SelectionMark selected={isOn} />}
              />
            );
          })}
        </GroupedList>
      ))}

      <Text style={styles.note}>
        Las promos son informativas: confirmá condiciones, tope y vigencia en el comercio antes de pagar.
      </Text>

      <Button label={isSaving ? "Guardando..." : "Guardar"} onPress={() => void handleSave()} loading={isSaving} />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  intro: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  note: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.tertiary,
  },
}));
