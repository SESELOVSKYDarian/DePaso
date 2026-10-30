import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { downloadManual } from "./downloadManual";
import { HOW_TO_STEPS } from "./steps";
import { useStyles } from "./styles";

/** Cómo usar DePaso: los pasos básicos y el manual completo para descargar en PDF. */
export default function HowToScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  // si no se pudo abrir la descarga, lo avisamos debajo del botón
  const onDownload = () => {
    setFailed(false);
    downloadManual().catch(() => setFailed(true));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>Así se usa DePaso. Para el paso a paso con todas las pantallas, bajate el manual.</Text>

      <View style={styles.card}>
        {HOW_TO_STEPS.map((step, index) => (
          <View key={step.title} style={[styles.step, index > 0 ? styles.separated : null]}>
            <View style={styles.badge}>
              <Ionicons name={step.icon} size={20} color={colors.brand.navy} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>
                {index + 1}. {step.title}
              </Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <AnimatedPressable accessibilityLabel="Descargar el manual de usuario en PDF" onPress={onDownload} style={styles.download}>
        <Ionicons name="download-outline" size={20} color={colors.text.onNavy} />
        <Text style={styles.downloadLabel}>Descargar manual (PDF)</Text>
      </AnimatedPressable>
      {failed ? <Text style={styles.error}>No pudimos abrir la descarga. Probá de nuevo en un rato.</Text> : null}
    </ScrollView>
  );
}
