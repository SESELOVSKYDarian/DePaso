import type { HomeBanner } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

/** Tarjetas de publicidad de comercios, siempre rotuladas como "Publicidad". */
export function AdBanners({ banners }: { banners: HomeBanner[] }) {
  const styles = useStyles();
  if (banners.length === 0) return null;
  return (
    <View style={styles.group}>
      {banners.map((banner) => (
        <View key={banner.id} accessibilityLabel={`Publicidad de ${banner.storeName}: ${banner.title}`} style={styles.card}>
          <Text style={styles.tag}>PUBLICIDAD · {banner.storeName.toUpperCase()}</Text>
          <Text style={styles.title}>{banner.title}</Text>
          {banner.message ? <Text style={styles.message}>{banner.message}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    group: { gap: spacing.sm },
    card: { gap: 4, padding: spacing.md, borderRadius: radii.xl, backgroundColor: colors.tint.blue.bg, borderWidth: 1, borderColor: colors.tint.blue.border },
    tag: { fontFamily: typography.caption.fontFamily, fontSize: 11, letterSpacing: 1, color: colors.brand.route },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 17, color: colors.text.primary },
    message: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
  }),
);
