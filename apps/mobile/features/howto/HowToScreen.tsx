import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackToTopScrollView } from "@/components/common/BackToTop";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { spacing } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { downloadManual } from "./downloadManual";
import { HowToSteps } from "./HowToSteps";
import { useStyles } from "./styles";

/** Cómo usar DePaso: los pasos básicos y el manual completo para descargar en PDF. Siempre se puede cerrar. */
export default function HowToScreen() {
  const styles = useStyles();
  const footer = useFooterStyles();
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  // si no se pudo abrir la descarga, lo avisamos debajo del botón
  const onDownload = () => {
    setFailed(false);
    downloadManual().catch(() => setFailed(true));
  };

  // si se llegó acá sin pantalla anterior, "Listo" lleva al inicio en vez de quedarse trabado
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView style={footer.screen} edges={["bottom"]}>
      <BackToTopScrollView contentContainerStyle={[styles.container, footer.content]}>
        <Text style={styles.intro}>Así se usa DePaso. Para el paso a paso con todas las pantallas, bajate el manual.</Text>
        <HowToSteps />
        <AnimatedPressable accessibilityLabel="Descargar el manual de usuario en PDF" onPress={onDownload} style={styles.download}>
          <Ionicons name="download-outline" size={20} color={colors.text.onNavy} />
          <Text style={styles.downloadLabel}>Descargar manual (PDF)</Text>
        </AnimatedPressable>
        {failed ? <Text style={styles.error}>No pudimos abrir la descarga. Probá de nuevo en un rato.</Text> : null}
      </BackToTopScrollView>
      <View style={footer.bar}>
        <Button label="Listo" onPress={close} />
      </View>
    </SafeAreaView>
  );
}

const useFooterStyles = makeStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface.base },
    content: { gap: spacing.md },
    bar: { padding: spacing.lg, paddingTop: spacing.sm },
  }),
);
