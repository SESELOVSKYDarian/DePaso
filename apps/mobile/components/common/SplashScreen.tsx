import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useTheme } from "@/lib/theme";
import { BrandLogo } from "./BrandLogo";

const CAPTIONS = [
  "Mirando por dónde pasás",
  "Buscando lo que te queda de paso",
  "Calculando cuánto te ahorrás",
] as const;

/**
 * Pantalla de carga inicial (depaso-carga en Figma): se muestra mientras `AuthContext`
 * resuelve el token guardado. Logo vertical de marca (claro/oscuro) y leyendas que rotan.
 * El paisaje de fondo es una ilustración clara: en modo oscuro se omite y queda el color de
 * fondo del tema.
 */
export function SplashScreen() {
  const styles = useStyles();
  const { isDark } = useTheme();
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCaptionIndex((i) => (i + 1) % CAPTIONS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {isDark ? null : (
        <Image
          source={require("../../assets/images/fondo-carga.png")}
          style={styles.background}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <BrandLogo variant="stacked" style={styles.logo} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.caption}>{CAPTIONS[captionIndex]}</Text>
        <View style={styles.dots}>
          {CAPTIONS.map((c, i) => (
            <View key={c} style={[styles.dot, i === captionIndex ? styles.dotActive : null]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    background: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: undefined,
      height: undefined,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    logo: {
      width: 260,
      height: 260,
    },
    footer: {
      alignItems: "center",
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    caption: {
      fontFamily: typography.bodyRegular.fontFamily,
      fontSize: 13,
      color: colors.text.muted,
    },
    dots: {
      flexDirection: "row",
      gap: spacing.xxs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border.strong,
    },
    dotActive: {
      backgroundColor: colors.saving.lime,
      width: 18,
    },
  }),
);
