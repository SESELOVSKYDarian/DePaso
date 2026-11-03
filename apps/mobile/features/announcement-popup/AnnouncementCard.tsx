import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { makeStyles, useColors } from "@/lib/theme";

interface AnnouncementCardProps {
  title: string;
  body: string;
  emoji?: string | null;
  /** Imagen grande (data URI o URL). Si hay, reemplaza al emoji. */
  imageUri?: string | null;
  /** Con `onClose` se muestran la cruz y el botón; sin él es solo una vista previa. */
  onClose?: () => void;
  /** Más chica, para la vista previa del administrador. */
  compact?: boolean;
  /** Dibuja la cruz y el botón como en la ventana real, pero sin acción (vista previa). */
  preview?: boolean;
}

/**
 * Tarjeta de un anuncio: imagen o emoji grande arriba, título, mensaje y botón. Es la misma para
 * la ventana que ven todos al abrir la app y para la vista previa del administrador.
 */
export function AnnouncementCard({ title, body, emoji, imageUri, onClose, compact = false, preview = false }: AnnouncementCardProps) {
  const close = onClose ?? (preview ? () => undefined : undefined);
  const styles = useStyles();
  const colors = useColors();
  const hasImage = Boolean(imageUri);
  const hasEmoji = !hasImage && Boolean(emoji?.trim());

  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      {close ? (
        <AnimatedPressable accessibilityLabel="Cerrar anuncio" haptic={false} onPress={close} style={styles.close}>
          <Ionicons name="close" size={20} color={colors.text.primary} />
        </AnimatedPressable>
      ) : null}

      {hasImage ? (
        <Image source={{ uri: imageUri as string }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.emojiWrap}>
          <View style={styles.emojiCircle}>
            {hasEmoji ? <Text style={styles.emoji}>{emoji}</Text> : <Ionicons name="megaphone" size={44} color={colors.brand.navy} />}
          </View>
        </View>
      )}

      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {title.trim() || "Título del anuncio"}
        </Text>
        <ScrollView style={compact ? styles.bodyScrollCompact : styles.bodyScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.body}>{body.trim() || "Acá va el mensaje que van a leer todos."}</Text>
        </ScrollView>
        {close ? <Button label="Entendido" onPress={close} style={{ borderRadius: radii.full }} /> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 14,
    },
    cardCompact: { maxWidth: 340 },
    close: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 5,
      width: 40,
      height: 40,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    image: { width: "100%", aspectRatio: 16 / 10, backgroundColor: colors.surface.input },
    emojiWrap: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xl + spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.tint.blue.bg },
    emojiCircle: {
      width: 104,
      height: 104,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.primary,
      borderWidth: 2,
      borderColor: colors.tint.blue.border,
      marginBottom: spacing.md,
    },
    emoji: { fontSize: 54, lineHeight: 64, textAlign: "center" },
    content: { gap: spacing.sm, padding: spacing.lg },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, lineHeight: 30, textAlign: "center", color: colors.text.primary },
    bodyScroll: { maxHeight: 190 },
    bodyScrollCompact: { maxHeight: 110 },
    body: { fontFamily: typography.body.fontFamily, fontSize: 15, lineHeight: 22, textAlign: "center", color: colors.text.secondary },
  }),
);
