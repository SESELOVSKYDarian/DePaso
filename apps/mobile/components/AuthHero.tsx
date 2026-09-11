import { Image, StyleSheet, Text, View } from "react-native";
import { colors, elevation, radii, spacing, typography } from "@depaso/design-tokens";

interface AuthHeroProps {
  title: string;
  subtitle: string;
}

/** Encabezado de las pantallas de auth: isotipo real en una placa suave + título/subtítulo.
 * Composición propia (no calca un ilustración de referencia de terceros — sección 94). */
export function AuthHero({ title, subtitle }: AuthHeroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: radii.xl,
    backgroundColor: colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...elevation.level2,
  },
  logo: {
    width: 52,
    height: 52,
  },
  title: {
    fontFamily: typography.display.fontFamily,
    fontSize: 26,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
    textAlign: "center",
  },
});
