import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { InfoButton } from "@/components/common/InfoButton";
import { AnnouncementCard } from "@/features/announcement-popup/AnnouncementCard";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { makeStyles, useColors } from "@/lib/theme";
import { useAnnouncements } from "./useAnnouncements";

const DURATIONS: { days: number | null; label: string }[] = [
  { days: null, label: "Sin vencimiento" },
  { days: 1, label: "1 día" },
  { days: 3, label: "3 días" },
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
];

const EMOJIS = ["📢", "🎉", "🛒", "💸", "🚀", "🔔", "⭐", "🎁", "🆕", "⚠️"];

/**
 * Administración: publicar anuncios para todos. Se pueden acompañar con un emoji o una imagen,
 * mostrar como ventana al abrir la app y mandar como notificación al celular. Abajo, la vista
 * previa de cómo lo van a ver.
 */
export default function AnnouncementsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const data = useAnnouncements();

  return (
    <BackToTopScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.introRow}>
        <Text style={styles.section}>Nuevo anuncio</Text>
        <InfoButton
          title="Publicar novedades"
          lines={["Lo que publiques aparece en Actividad › Novedades de todos.", "Además podés mostrarlo como ventana al abrir la app y mandarlo como notificación al celular."]}
        />
      </View>

      <FormField label="Título" value={data.title} onChangeText={data.setTitle} placeholder="Ej.: Nueva versión de DePaso" maxLength={120} />
      <FormField label="Mensaje" value={data.body} onChangeText={data.setBody} placeholder="Contá la novedad en pocas líneas" multiline maxLength={2000} error={data.error} />

      <Text style={styles.label}>Ícono (opcional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
        {EMOJIS.map((item) => {
          const selected = data.emoji === item;
          return (
            <AnimatedPressable
              key={item}
              accessibilityLabel={`Usar el emoji ${item}`}
              haptic={false}
              onPress={() => data.setEmoji(selected ? "" : item)}
              style={[styles.emojiChip, selected ? styles.emojiChipSelected : null]}
            >
              <Text style={styles.emojiChipText}>{item}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
      <FormField label="O escribí otro emoji" value={data.emoji} onChangeText={data.setEmoji} placeholder="🎊" maxLength={8} />

      <Text style={styles.label}>Imagen (opcional)</Text>
      {data.image ? (
        <View style={styles.imageBox}>
          <Image source={{ uri: data.image.imageData }} style={styles.imagePreview} contentFit="cover" />
          <AnimatedPressable accessibilityLabel="Quitar la imagen" haptic={false} onPress={() => data.setImage(null)} style={styles.removeImage}>
            <Ionicons name="close" size={18} color={colors.text.onNavy} />
          </AnimatedPressable>
        </View>
      ) : null}
      <Button
        label={data.pickingImage ? "Preparando imagen…" : data.image ? "Cambiar imagen" : "Subir una imagen"}
        variant="secondary"
        onPress={() => void data.pickImage()}
        loading={data.pickingImage}
      />

      <View style={styles.introRow}>
        <Text style={styles.label}>Cuánto tiempo se muestra</Text>
        <InfoButton title="Duración" lines={["Pasado ese tiempo el anuncio deja de verse en la ventana y en Actividad."]} />
      </View>
      <View style={styles.durations}>
        {DURATIONS.map((option) => {
          const selected = data.durationDays === option.days;
          return (
            <AnimatedPressable key={option.label} accessibilityLabel={option.label} haptic={false} onPress={() => data.setDurationDays(option.days)} style={[styles.durationChip, selected ? styles.durationChipSelected : null]}>
              <Text style={[styles.durationText, selected ? styles.durationTextSelected : null]}>{option.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.switchCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>Ventana al abrir la app</Text>
            <Text style={styles.switchSub}>La ven todos una vez, con una cruz para cerrarla.</Text>
          </View>
          <Switch value={data.showPopup} onValueChange={data.setShowPopup} trackColor={{ true: colors.brand.navy, false: colors.border.strong }} thumbColor="#FFFFFF" accessibilityLabel="Mostrar como ventana al abrir la app" />
        </View>
        <View style={[styles.switchRow, styles.switchSeparated]}>
          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>Notificación al celular</Text>
            <Text style={styles.switchSub}>Les llega aunque no tengan la app abierta (si activaron las novedades).</Text>
          </View>
          <Switch value={data.sendPush} onValueChange={data.setSendPush} trackColor={{ true: colors.brand.navy, false: colors.border.strong }} thumbColor="#FFFFFF" accessibilityLabel="Mandar como notificación al celular" />
        </View>
      </View>

      <Text style={styles.label}>Así lo van a ver</Text>
      <View style={styles.previewBox}>
        <AnnouncementCard title={data.title} body={data.body} emoji={data.emoji} imageUri={data.image?.imageData ?? null} compact preview />
      </View>

      <Button label={data.publishing ? "Publicando…" : "Publicar anuncio"} onPress={() => void data.publish()} loading={data.publishing} />

      <Text style={styles.section}>Publicados</Text>
      {data.loading ? <ActivityIndicator color={colors.text.secondary} /> : null}
      {!data.loading && data.items.length === 0 ? <Text style={styles.empty}>Todavía no publicaste ninguno.</Text> : null}
      {data.items.map((item) => (
        <View key={item.id} style={[styles.card, item.active ? null : styles.cardHidden]}>
          <View style={styles.cardHead}>
            {item.thumbData ? (
              <Image source={{ uri: item.thumbData }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={styles.thumbEmoji}>{item.emoji ? <Text style={styles.thumbEmojiText}>{item.emoji}</Text> : <Ionicons name="megaphone-outline" size={20} color={colors.brand.route} />}</View>
            )}
            <View style={styles.cardText}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={3}>
                {item.body}
              </Text>
            </View>
          </View>
          <View style={styles.badges}>
            <Text style={styles.meta}>{formatRelativeTime(item.createdAt)}</Text>
            <Text style={[styles.badge, item.active ? styles.badgeOn : null]}>{item.active ? "Visible" : "Oculto"}</Text>
            {item.showPopup ? <Text style={styles.badge}>Ventana</Text> : null}
            {item.expiresAt ? <Text style={styles.badge}>{new Date(item.expiresAt) > new Date() ? `Vence el ${new Date(item.expiresAt).toLocaleDateString("es-AR")}` : "Vencido"}</Text> : null}
            {item.pushedAt ? <Text style={styles.badge}>Enviado al celular</Text> : null}
          </View>
          <View style={styles.actions}>
            <AnimatedPressable accessibilityLabel={item.active ? "Ocultar anuncio" : "Mostrar anuncio"} haptic={false} onPress={() => void data.toggle(item)} style={styles.action}>
              <Ionicons name={item.active ? "eye-off-outline" : "eye-outline"} size={18} color={colors.text.primary} />
              <Text style={styles.actionText}>{item.active ? "Ocultar" : "Mostrar"}</Text>
            </AnimatedPressable>
            <AnimatedPressable accessibilityLabel="Borrar anuncio" haptic={false} onPress={() => void data.remove(item)} style={styles.action}>
              <Ionicons name="trash-outline" size={18} color={colors.state.errorStrong} />
              <Text style={[styles.actionText, { color: colors.state.errorStrong }]}>Borrar</Text>
            </AnimatedPressable>
          </View>
        </View>
      ))}
    </BackToTopScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
    introRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    intro: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    label: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, marginTop: spacing.xs },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.md },
    empty: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    emojiRow: { gap: spacing.sm, paddingVertical: 2 },
    emojiChip: { width: 48, height: 48, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    emojiChipSelected: { borderColor: colors.brand.navy, borderWidth: 2, backgroundColor: colors.tint.blue.bg },
    emojiChipText: { fontSize: 24 },
    imageBox: { borderRadius: radii.xl, overflow: "hidden", backgroundColor: colors.surface.input },
    imagePreview: { width: "100%", aspectRatio: 16 / 10 },
    removeImage: { position: "absolute", top: spacing.sm, right: spacing.sm, width: 34, height: 34, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" },
    durations: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    durationChip: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radii.full, borderWidth: 1, borderColor: colors.border.subtle, backgroundColor: colors.surface.primary },
    durationChipSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
    durationText: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    durationTextSelected: { color: colors.brand.navy },
    switchCard: { borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle, overflow: "hidden" },
    switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
    switchSeparated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle },
    switchText: { flex: 1, gap: 2 },
    switchTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    switchSub: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
    previewBox: { padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.input, alignItems: "center" },
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    cardHidden: { opacity: 0.55 },
    cardHead: { flexDirection: "row", gap: spacing.sm },
    thumb: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.surface.input },
    thumbEmoji: { width: 56, height: 56, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint.blue.bg },
    thumbEmojiText: { fontSize: 26 },
    cardText: { flex: 1, gap: 2 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    body: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    badges: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.tertiary },
    badge: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, backgroundColor: colors.surface.input, overflow: "hidden" },
    badgeOn: { backgroundColor: colors.saving.lime, color: colors.text.onLime },
    actions: { flexDirection: "row", gap: spacing.lg },
    action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
    actionText: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary },
  }),
);
