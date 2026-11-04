import type { HomeAd } from "@depaso/validation";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { AdVideo } from "./AdVideo";

/** Pie de una publicidad: siempre rotulada como "Publicidad" y con el nombre del comercio. */
function AdCaption({ ad }: { ad: HomeAd }) {
  const styles = useStyles();
  return (
    <View style={styles.caption}>
      <Text style={styles.tag}>PUBLICIDAD · {ad.storeName.toUpperCase()}</Text>
      <Text style={styles.title}>{ad.title}</Text>
      {ad.message ? <Text style={styles.message}>{ad.message}</Text> : null}
    </View>
  );
}

/** Imágenes y videos de comercios, arriba en Inicio. */
export function TopAds({ ads }: { ads: HomeAd[] }) {
  const styles = useStyles();
  const media = ads.filter((ad) => ad.kind === "IMAGE" || ad.kind === "VIDEO");
  if (media.length === 0) return null;
  return (
    <View style={styles.group}>
      {media.map((ad) => (
        <View key={ad.id} accessibilityLabel={`Publicidad de ${ad.storeName}: ${ad.title}`} style={styles.card}>
          {ad.kind === "IMAGE" && ad.imageData ? <Image source={{ uri: ad.imageData }} accessibilityLabel={ad.title} style={styles.media} contentFit="cover" /> : null}
          {ad.kind === "VIDEO" && ad.videoUrl ? <AdVideo url={ad.videoUrl} style={styles.media} /> : null}
          <AdCaption ad={ad} />
        </View>
      ))}
    </View>
  );
}

/** Banners de texto, abajo en Inicio. */
export function BottomBanners({ ads }: { ads: HomeAd[] }) {
  const styles = useStyles();
  const banners = ads.filter((ad) => ad.kind === "BANNER");
  if (banners.length === 0) return null;
  return (
    <View style={styles.group}>
      {banners.map((ad) => (
        <View key={ad.id} accessibilityLabel={`Publicidad de ${ad.storeName}: ${ad.title}`} style={[styles.card, styles.banner]}>
          <AdCaption ad={ad} />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    group: { gap: spacing.sm },
    card: { overflow: "hidden", borderRadius: radii.xl, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    banner: { backgroundColor: colors.tint.blue.bg, borderColor: colors.tint.blue.border },
    media: { width: "100%", aspectRatio: 4 / 5, maxHeight: 420, backgroundColor: colors.surface.input },
    caption: { gap: 4, padding: spacing.md },
    tag: { fontFamily: typography.caption.fontFamily, fontSize: 11, letterSpacing: 1, color: colors.brand.route },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 17, color: colors.text.primary },
    message: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
  }),
);
