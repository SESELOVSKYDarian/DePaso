import { StyleSheet, Text, View } from "react-native";
import { elevation, radii, spacing, typography } from "@depaso/design-tokens";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles } from "@/lib/theme";
import { BrandLogo } from "../common/BrandLogo";

interface AuthHeroProps {
  title: string;
  subtitle: string;
}

/**
 * Encabezado de las pantallas de auth: isotipo vectorial en una placa suave + título/subtítulo.
 * Con el panel de la marca al costado (computadora) la placa sobra: ya está el logo ahí.
 */
export function AuthHero({ title, subtitle }: AuthHeroProps) {
  const styles = useStyles();
  const { hasBrandPanel } = useBreakpoint();
  return (
    <View style={[styles.container, hasBrandPanel ? styles.containerCompact : null]}>
      {hasBrandPanel ? null : (
        <View style={styles.badge}>
          <BrandLogo variant="mark" style={styles.logo} />
        </View>
      )}
      <Text accessibilityRole="header" style={[styles.title, hasBrandPanel ? styles.titleCompact : null]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, hasBrandPanel ? styles.subtitleCompact : null]}>{subtitle}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    containerCompact: { marginBottom: spacing.lg },
    titleCompact: { fontSize: 24 },
    subtitleCompact: { fontSize: 13 },
    badge: {
      width: 84,
      height: 84,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
      ...elevation.level2,
    },
    logo: {
      width: 60,
      height: 60,
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
  }),
);
