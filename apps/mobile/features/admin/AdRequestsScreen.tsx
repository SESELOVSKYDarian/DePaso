import type { AdResponse } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { adsClient } from "@/lib/apiClient";
import { AdStatusCard } from "@/features/merchant-ads/AdStatusCard";
import { makeStyles, useColors } from "@/lib/theme";

const DAYS = [7, 15, 30];

/**
 * Administración de la publicidad: los pedidos de los comercios con lo que ofrece cada uno.
 * Se aprueba con el monto y los días acordados (por defecto lo ofrecido) o se rechaza con un motivo.
 */
export default function AdRequestsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { show: showToast } = useToast();
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  // lo que se está acordando por pedido (monto y días) y el motivo de rechazo
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [days, setDays] = useState<Record<string, number>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const { ads: list } = await adsClient.admin.list();
      setAds(list);
    } catch {
      showToast("No pudimos cargar los pedidos.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const decide = async (ad: AdResponse, decision: "APPROVE" | "REJECT") => {
    setBusyId(ad.id);
    try {
      const raw = amounts[ad.id];
      const agreed = raw !== undefined ? Number(raw.replace(/\./g, "").replace(",", ".")) : undefined;
      const updated = await adsClient.admin.decide(ad.id, {
        decision,
        ...(decision === "APPROVE" ? { ...(agreed !== undefined && Number.isFinite(agreed) ? { agreedAmount: agreed } : {}), durationDays: days[ad.id] ?? ad.durationDays } : { note: reason.trim() }),
      });
      setAds((current) => current.map((entry) => (entry.id === ad.id ? updated : entry)));
      setRejecting(null);
      setReason("");
      showToast(decision === "APPROVE" ? "Aprobada: ya se muestra en la app." : "Rechazada: el comercio ve el motivo.", decision === "APPROVE" ? "success" : "info");
    } catch {
      showToast("No pudimos guardar la decisión.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const pending = ads.filter((ad) => ad.status === "PENDING");
  const others = ads.filter((ad) => ad.status !== "PENDING");

  return (
    <BackToTopScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Los comercios ofrecen un monto por aparecer en Destacados o con una tarjeta en Inicio. Acordá el monto y aprobalo, o rechazalo con un motivo.</Text>
      {loading ? <ActivityIndicator color={colors.text.secondary} /> : null}

      <Text style={styles.section}>Pendientes {pending.length > 0 ? `(${pending.length})` : ""}</Text>
      {!loading && pending.length === 0 ? <Text style={styles.empty}>No hay pedidos por revisar.</Text> : null}
      {pending.map((ad) => (
        <AdStatusCard key={ad.id} ad={ad} showMerchant>
          <View style={styles.deal}>
            <FormField label="Monto acordado (pesos)" value={amounts[ad.id] ?? String(Math.round(ad.offeredAmount))} onChangeText={(value) => setAmounts((current) => ({ ...current, [ad.id]: value }))} keyboardType="numeric" />
            <View style={styles.days}>
              {DAYS.map((value) => {
                const selected = (days[ad.id] ?? ad.durationDays) === value;
                return (
                  <AnimatedPressable key={value} accessibilityLabel={`${value} días`} haptic={false} onPress={() => setDays((current) => ({ ...current, [ad.id]: value }))} style={[styles.dayChip, selected ? styles.dayChipSelected : null]}>
                    <Text style={[styles.dayText, selected ? styles.dayTextSelected : null]}>{value} días</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            {rejecting === ad.id ? (
              <>
                <FormField label="Motivo del rechazo" value={reason} onChangeText={setReason} placeholder="Ej.: El texto no se entiende" multiline maxLength={300} />
                <View style={styles.row}>
                  <Button label="Volver" variant="ghost" onPress={() => setRejecting(null)} style={{ flex: 1 }} />
                  <Button label="Rechazar" variant="secondary" onPress={() => void decide(ad, "REJECT")} loading={busyId === ad.id} disabled={!reason.trim()} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <View style={styles.row}>
                <Button label="Rechazar" variant="secondary" onPress={() => setRejecting(ad.id)} style={{ flex: 1 }} />
                <Button label={busyId === ad.id ? "Guardando…" : "Aprobar"} onPress={() => void decide(ad, "APPROVE")} loading={busyId === ad.id} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        </AdStatusCard>
      ))}

      {others.length > 0 ? <Text style={styles.section}>Resueltos</Text> : null}
      {others.map((ad) => (
        <AdStatusCard key={ad.id} ad={ad} showMerchant />
      ))}
    </BackToTopScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    intro: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.sm },
    empty: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    deal: { gap: spacing.sm, marginTop: spacing.sm },
    days: { flexDirection: "row", gap: spacing.sm },
    dayChip: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.surface.input, borderWidth: 1, borderColor: colors.border.subtle },
    dayChipSelected: { backgroundColor: colors.brand.navy, borderColor: colors.brand.navy },
    dayText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.primary },
    dayTextSelected: { color: colors.text.onNavy },
    row: { flexDirection: "row", gap: spacing.sm },
  }),
);
