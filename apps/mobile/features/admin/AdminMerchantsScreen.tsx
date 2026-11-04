import type { AdminMerchant } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { BackToTopFlatList } from "@/components/common/BackToTop";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { EmptyState } from "@/components/common/EmptyState";
import { InfoButton } from "@/components/common/InfoButton";
import { SearchField } from "@/components/common/SearchField";
import { useToast } from "@/components/common/Toast";
import { adsClient } from "@/lib/apiClient";
import { LIST_PERFORMANCE } from "@/lib/listPerformance";
import { makeStyles, useColors } from "@/lib/theme";

const KIND_LABEL = { FEATURED_PRODUCT: "Producto destacado", BANNER: "Banner", IMAGE: "Imagen", VIDEO: "Video" } as const;

const INFO_LINES = [
  "Acá están todos los comercios que administran su sucursal en DePaso.",
  "Si deshabilitás un comercio, su sucursal deja de aparecer en los resultados y su publicidad se deja de mostrar. No se borra nada: podés volver a habilitarlo cuando quieras.",
];

/** Administración: todos los comercios de la app, con buscador, su publicidad y un interruptor para habilitarlos. */
export default function AdminMerchantsScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { show: showToast } = useToast();
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(
    async (query: string) => {
      try {
        const { merchants: list } = await adsClient.admin.merchants(query.trim() || undefined);
        setMerchants(list);
      } catch {
        showToast("No pudimos cargar los comercios.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // busca en el servidor con una pausa corta mientras se escribe
  useEffect(() => {
    const timer = setTimeout(() => void load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  // al volver a esta pantalla se refresca
  useFocusEffect(
    useCallback(() => {
      void load(search);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  const toggle = async (merchant: AdminMerchant, enabled: boolean) => {
    setMerchants((current) => current.map((entry) => (entry.branchId === merchant.branchId ? { ...entry, enabled } : entry)));
    try {
      await adsClient.admin.setMerchantEnabled(merchant.branchId, enabled);
      showToast(enabled ? "Comercio habilitado." : "Comercio deshabilitado: ya no se muestra en la app.", enabled ? "success" : "info");
    } catch {
      setMerchants((current) => current.map((entry) => (entry.branchId === merchant.branchId ? { ...entry, enabled: !enabled } : entry)));
      showToast("No pudimos cambiarlo.", "error");
    }
  };

  return (
    <BackToTopFlatList
      {...LIST_PERFORMANCE}
      data={merchants}
      keyExtractor={(item) => item.branchId}
      style={styles.container}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Buscar comercio, dirección o mail" />
          </View>
          <InfoButton title="Comercios habilitados" lines={INFO_LINES} />
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.text.secondary} />
        ) : (
          <EmptyState emoji="🏬" title={search ? "Ningún comercio coincide" : "Todavía no hay comercios"} description={search ? "Probá con otro nombre." : "Cuando apruebes una solicitud, el comercio aparece acá."} />
        )
      }
      renderItem={({ item }) => (
        <View style={[styles.card, item.enabled ? null : styles.cardOff]}>
          <View style={styles.head}>
            <View style={styles.headText}>
              <Text style={styles.name}>{item.storeName}</Text>
              <Text style={styles.meta}>{item.branchName} · {item.address}</Text>
              <Text style={styles.meta}>{item.ownerName ? `${item.ownerName} · ` : ""}{item.ownerEmail}</Text>
            </View>
            <Switch
              accessibilityLabel={`${item.enabled ? "Deshabilitar" : "Habilitar"} ${item.storeName}`}
              value={item.enabled}
              onValueChange={(value) => void toggle(item, value)}
              trackColor={{ true: colors.brand.navy, false: colors.border.strong }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.badges}>
            <Text style={[styles.badge, item.enabled ? styles.badgeOn : null]}>{item.enabled ? "Habilitado" : "Deshabilitado"}</Text>
            {item.pendingAds > 0 ? <Text style={[styles.badge, styles.badgeWait]}>{item.pendingAds} pedido{item.pendingAds === 1 ? "" : "s"} de publicidad</Text> : null}
          </View>
          {item.activeAds.length > 0 ? (
            <View style={styles.ads}>
              <Text style={styles.adsTitle}>Publicidad vigente</Text>
              {item.activeAds.map((ad) => (
                <Text key={ad.id} style={styles.meta}>
                  {KIND_LABEL[ad.kind]}: {ad.title} · hasta el {new Date(ad.endsAt).toLocaleDateString("es-AR")}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.meta}>Sin publicidad vigente.</Text>
          )}
        </View>
      )}
    />
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm },
    searchBox: { flex: 1 },
    card: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    cardOff: { opacity: 0.7 },
    head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    headText: { flex: 1, gap: 2 },
    name: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    badge: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, backgroundColor: colors.surface.input, overflow: "hidden" },
    badgeOn: { backgroundColor: colors.saving.lime, color: colors.text.onLime },
    badgeWait: { backgroundColor: colors.tint.amber.bg, color: colors.tint.amber.text },
    ads: { gap: 2, marginTop: spacing.xxs },
    adsTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.primary },
  }),
);
