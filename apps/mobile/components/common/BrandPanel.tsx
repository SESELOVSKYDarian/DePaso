import { Platform, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles } from "@/lib/theme";
import { BrandLogo } from "./BrandLogo";
import { Illustration } from "./Illustration";

/** Un resplandor suave detrás de la ilustración (solo en la web, donde hay degradados). */
const GLOW =
  Platform.OS === "web"
    ? ({ backgroundImage: "radial-gradient(50% 50% at 50% 50%, rgba(124,176,255,0.22), rgba(124,176,255,0) 100%)" } as object)
    : null;

/**
 * Mitad izquierda de las pantallas de ingreso en una computadora. Pocas cosas y mucho aire: el
 * logo arriba, la ilustración al centro y una sola frase. En el celular no se usa.
 */
export function BrandPanel() {
  const styles = useStyles();
  // la ilustración acompaña al alto de la ventana, sin pasarse
  const { height } = useBreakpoint();
  const size = Math.max(220, Math.min(380, height * 0.42));
  return (
    <View style={styles.panel}>
      <BrandLogo variant="wordmark" style={styles.logo} />

      <View style={styles.center}>
        <View style={[styles.stage, { width: size * 1.5, height: size * 1.5 }, GLOW]}>
          <Illustration
            source={require("@/assets/images/bienvenida.png")}
            darkSource={require("@/assets/images/bienvenida-dark.png")}
            style={{ width: size * 1.15, height: size }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Tu compra, en el camino.</Text>
        <Text style={styles.subtitle}>Los mejores precios en los comercios que te quedan de paso.</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    panel: { flex: 1, backgroundColor: colors.surface.primary, padding: spacing.xl },
    logo: { width: 150, height: 40, alignSelf: "flex-start" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs, marginTop: -spacing.xl },
    stage: { alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 30, lineHeight: 38, color: colors.text.primary, textAlign: "center" },
    subtitle: { fontFamily: typography.body.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary, textAlign: "center", maxWidth: 360 },
  }),
);