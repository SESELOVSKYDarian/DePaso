import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Switch, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import {
  NEARBY_RADIUS_OPTIONS,
  formatRadius,
  getNearbyRadius,
  isNearbyEnabled,
  requestNearbyPermission,
  setNearbyEnabled,
  setNearbyRadius,
  startNearbyAlerts,
} from "@/lib/notifications/nearby";
import { getPermissionState, requestPermission } from "@/lib/notifications/push";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { makeStyles, useColors } from "@/lib/theme";

/** "Avisame cuando estoy cerca": prende el aviso y deja elegir a cuántos metros salta. */
export function NearbyAlertCard() {
  const colors = useColors();
  const styles = useStyles();
  const { plan } = usePurchase();
  const [enabled, setEnabled] = useState(false);
  const [radius, setRadius] = useState<number>(500);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    void (async () => {
      setEnabled(await isNearbyEnabled());
      setRadius(await getNearbyRadius());
    })();
  }, []);

  const toggle = async (value: boolean) => {
    setMessage(undefined);
    if (!value) {
      setEnabled(false);
      await setNearbyEnabled(false);
      return;
    }
    // hacen falta dos permisos: avisos del celular y ubicación "todo el tiempo"
    let notifications = await getPermissionState();
    if (notifications === "undetermined") notifications = await requestPermission();
    if (notifications !== "granted") {
      setMessage("Para avisarte necesitamos los avisos del celular activados.");
      return;
    }
    if (!(await requestNearbyPermission())) {
      setMessage('Elegí "Permitir todo el tiempo" en la ubicación para que funcione con la app cerrada.');
      return;
    }
    setEnabled(true);
    await setNearbyEnabled(true);
    if (plan) await startNearbyAlerts(plan);
  };

  const pickRadius = async (meters: number) => {
    setRadius(meters);
    await setNearbyRadius(meters);
    if (enabled && plan) await startNearbyAlerts(plan);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="location-outline" size={20} color={colors.brand.navy} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>Avisame cuando estoy cerca</Text>
          <Text style={styles.sub}>Te avisamos al acercarte a un comercio de tu compra de hoy, aunque tengas la app cerrada.</Text>
        </View>
        <Switch
          accessibilityLabel="Avisame cuando estoy cerca de un comercio"
          value={enabled}
          onValueChange={(value) => void toggle(value)}
          trackColor={{ true: colors.brand.navy, false: colors.border.strong }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled ? (
        <View style={styles.radiusBlock}>
          <Text style={styles.sub}>Avisarme a partir de</Text>
          <View style={styles.chips}>
            {NEARBY_RADIUS_OPTIONS.map((meters) => (
              <AnimatedPressable
                key={meters}
                accessibilityLabel={`Avisar a ${formatRadius(meters)} de distancia`}
                haptic={false}
                onPress={() => void pickRadius(meters)}
                style={[styles.chip, radius === meters ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipText, radius === meters ? styles.chipTextSelected : null]}>{formatRadius(meters)}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      ) : null}

      {message ? (
        <View style={styles.messageBlock}>
          <Text accessibilityRole="alert" style={styles.message}>
            {message}
          </Text>
          <AnimatedPressable accessibilityLabel="Abrir ajustes del celular" haptic={false} onPress={() => void Linking.openSettings()}>
            <Text style={styles.link}>Abrir ajustes</Text>
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    icon: { width: 38, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint.blue.bg },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    sub: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
    radiusBlock: { gap: spacing.xs },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    chip: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radii.full, borderWidth: 1, borderColor: colors.border.subtle },
    chipSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
    chipText: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    chipTextSelected: { color: colors.brand.navy },
    messageBlock: { gap: 4 },
    message: { fontFamily: typography.caption.fontFamily, fontSize: 13, lineHeight: 18, color: colors.state.errorStrong },
    link: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.brand.route },
  }),
);
