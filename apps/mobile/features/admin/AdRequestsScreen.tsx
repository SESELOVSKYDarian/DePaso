import type { AdResponse } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { InfoButton } from "@/components/common/InfoButton";
import { SearchField } from "@/components/common/SearchField";
import { useToast } from "@/components/common/Toast";
import { adsClient } from "@/lib/apiClient";
import { AdStatusCard } from "@/features/merchant-ads/AdStatusCard";
import { makeStyles, useColors } from "@/lib/theme";
import { AdDecisionPanel } from "./components/AdDecisionPanel";
import { AdPricesCard } from "./components/AdPricesCard";

const KIND_WORDS: Record<AdResponse["kind"], string> = { FEATURED_PRODUCT: "producto destacado", BANNER: "banner", IMAGE: "imagen", VIDEO: "video" };

const INFO_LINES = [
  "Los comercios ofrecen un monto por aparecer en Destacados o en Inicio con un banner, una imagen o un video.",
  "Podés aprobar el pedido, proponer otro monto (el comercio lo acepta, lo rechaza o contrapropone) o rechazarlo con un motivo.",
  "El cobro se arregla fuera de la app: acá queda registrado el monto acordado.",
];

const toNumber = (text: string) => Number(text.replace(/\./g, "").replace(",", "."));

/**
 * Administración de la publicidad: los pedidos de los comercios con lo que ofrece cada uno.
 * Se aprueba, se propone otro monto o se rechaza con un motivo; hay buscador por comercio.
 */
export default function AdRequestsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { show: showToast } = useToast();
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const decide = async (ad: AdResponse, decision: Parameters<typeof adsClient.admin.decide>[1], done: string) => {
    setBusyId(ad.id);
    try {
      const updated = await adsClient.admin.decide(ad.id, decision);
      setAds((current) => current.map((entry) => (entry.id === ad.id ? updated : entry)));
      showToast(done, "success");
    } catch {
      showToast("No pudimos guardar la decisión.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const approve = (ad: AdResponse, amountText: string, days: number) => {
    const agreed = toNumber(amountText);
    if (!Number.isFinite(agreed) || agreed <= 0) return showToast("El monto no es válido.", "error");
    void decide(ad, { decision: "APPROVE", agreedAmount: agreed, durationDays: days }, "Aprobada: ya se muestra en la app.");
  };

  const counter = (ad: AdResponse, amountText: string, days: number, note: string) => {
    const amount = toNumber(amountText);
    if (!Number.isFinite(amount) || amount <= 0) return showToast("Poné el monto que proponés.", "error");
    void decide(ad, { decision: "COUNTER", counterAmount: amount, durationDays: days, ...(note.trim() ? { note: note.trim() } : {}) }, "Propuesta enviada: el comercio la recibe en su Actividad.");
  };

  // buscador: por comercio, mail, título o tipo de publicidad
  const needle = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      ads.filter((ad) =>
        needle === "" ? true : [ad.merchantName, ad.merchantEmail, ad.title, KIND_WORDS[ad.kind]].some((field) => field?.toLowerCase().includes(needle)),
      ),
    [ads, needle],
  );
  const pending = visible.filter((ad) => ad.status === "PENDING");
  const waiting = visible.filter((ad) => ad.status === "COUNTER");
  const others = visible.filter((ad) => ad.status !== "PENDING" && ad.status !== "COUNTER");

  return (
    <BackToTopScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <SearchField value={search} onChangeText={setSearch} placeholder="Buscar por comercio, mail o título" />
        </View>
        <InfoButton title="Publicidad de comercios" lines={INFO_LINES} />
      </View>
      <AdPricesCard />
      {loading ? <ActivityIndicator color={colors.text.secondary} /> : null}

      <Text style={styles.section}>Por revisar {pending.length > 0 ? `(${pending.length})` : ""}</Text>
      {!loading && pending.length === 0 ? <Text style={styles.empty}>{needle ? "Ningún pedido coincide." : "No hay pedidos por revisar."}</Text> : null}
      {pending.map((ad) => (
        <AdStatusCard key={ad.id} ad={ad} showMerchant>
          <AdDecisionPanel
            ad={ad}
            busy={busyId === ad.id}
            onApprove={(amount, days) => approve(ad, amount, days)}
            onCounter={(amount, days, note) => counter(ad, amount, days, note)}
            onReject={(note) => void decide(ad, { decision: "REJECT", note }, "Rechazada: el comercio ve el motivo.")}
          />
        </AdStatusCard>
      ))}

      {waiting.length > 0 ? <Text style={styles.section}>Esperando respuesta del comercio ({waiting.length})</Text> : null}
      {waiting.map((ad) => (
        <AdStatusCard key={ad.id} ad={ad} showMerchant />
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
    searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    searchBox: { flex: 1 },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.sm },
    empty: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, borderRadius: radii.lg },
  }),
);
