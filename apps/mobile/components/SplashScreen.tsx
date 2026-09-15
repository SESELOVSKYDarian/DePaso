import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@depaso/design-tokens";

const CAPTIONS = [
  "Comparando rutas y optimizando tu viaje",
  "Buscando los mejores precios cerca tuyo",
  "Calculando cuánto podés ahorrar",
] as const;

/** Pantalla de carga inicial (depaso-carga en Figma) — se muestra mientras `AuthContext`
 * resuelve el token guardado. Las leyendas rotan para dar sensación de progreso real,
 * aunque el chequeo de sesión suele resolverse casi al instante. */
export function SplashScreen() {
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCaptionIndex((i) => (i + 1) % CAPTIONS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/fondo-carga.png")}
        style={styles.background}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Image
          source={require("../assets/images/logo-wordmark.png")}
          style={styles.wordmark}
          resizeMode="contain"
        />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  wordmark: {
    width: 220,
    height: 74,
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
});
