import type { AdResponse } from "@depaso/validation";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";

export const pesos = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;

const KIND_INFO: Record<AdResponse["kind"], { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  FEATURED_PRODUCT: { label: "Producto destacado", icon: "star-outline" },
  BANNER: { label: "Banner abajo", icon: "megaphone-outline" },
  IMAGE: { label: "Imagen", icon: "image-outline" },
  VIDEO: { label: "Video", icon: "videocam-outline" },
};

const STATUS_LABEL: Record<AdResponse["status"], string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "No aprobada",
  CANCELLED: "Cancelada",
};

/** Una publicidad con su estado, el dinero ofrecido/acordado y lo que dijo el administrador. `children` = acciones. */
export function AdStatusCard({ ad, showMerchant = false, children }: { ad: AdResponse; showMerchant?: boolean; children?: ReactNode }) {
  const styles = useStyles();
  const colors = useColors();
  const dateLabel = ad.endsAt ? `${ad.active ? "Vigente hasta" : "Terminó"} el ${new Date(ad.endsAt).toLocaleDateString("es-AR")}` : null;

  return (
    <View style={styles.card}>
      {showMerchant ? (
        <Text style={styles.merchant} numberOfLines={1}>
          {ad.merchantName ?? "Comercio"} · {ad.merchantEmail}
        </Text>
      ) : null}
      <View style={styles.head}>
        <View style={styles.kind}>
          <Ionicons name={KIND_INFO[ad.kind].icon} size={16} color={colors.brand.route} />
          <Text style={styles.kindText}>{KIND_INFO[ad.kind].label}</Text>
        </View>
        <Text style={[styles.status, ad.status === "APPROVED" ? styles.statusOk : ad.status === "PENDING" ? styles.statusWait : null]}>{STATUS_LABEL[ad.status]}</Text>
      </View>
      <Text style={styles.title}>{ad.title}</Text>
      {ad.productName ? <Text style={styles.line}>Producto: {ad.productName}</Text> : null}
      {ad.message ? <Text style={styles.line}>{ad.message}</Text> : null}
      {ad.imageData ? <Image source={{ uri: ad.imageData }} accessibilityLabel="Imagen de la publicidad" style={styles.image} contentFit="cover" /> : null}
      {ad.videoUrl ? (
        <Text style={styles.line} selectable>
          Video: {ad.videoUrl}
        </Text>
      ) : null}
      <Text style={styles.money}>
        {ad.agreedAmount !== null && ad.agreedAmount !== ad.offeredAmount
          ? `Ofreció ${pesos(ad.offeredAmount)} · acordado ${pesos(ad.agreedAmount)} · ${ad.durationDays} días`
          : `${ad.status === "APPROVED" ? "Acordado" : "Ofrece"} ${pesos(ad.agreedAmount ?? ad.offeredAmount)} · ${ad.durationDays} días`}
      </Text>
      {dateLabel ? <Text style={styles.line}>{dateLabel}</Text> : null}
      {ad.adminNote ? <Text style={styles.note}>Nota del equipo: {ad.adminNote}</Text> : null}
      <Text style={styles.meta}>Pedida {formatRelativeTime(ad.createdAt)}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: { gap: 4, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    merchant: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    kind: { flexDirection: "row", alignItems: "center", gap: 6 },
    kindText: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    status: { fontFamily: typography.itemTitle.fontFamily, fontSize: 12, color: colors.text.secondary, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, backgroundColor: colors.surface.input, overflow: "hidden" },
    statusOk: { backgroundColor: colors.saving.lime, color: colors.text.onLime },
    statusWait: { backgroundColor: colors.tint.amber.bg, color: colors.tint.amber.text },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    image: { width: "100%", aspectRatio: 4 / 5, maxHeight: 300, borderRadius: radii.lg, backgroundColor: colors.surface.input, marginVertical: 4 },
    line: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    money: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, marginTop: 2 },
    note: { fontFamily: typography.body.fontFamily, fontSize: 13, lineHeight: 19, color: colors.state.errorStrong },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
  }),
);
