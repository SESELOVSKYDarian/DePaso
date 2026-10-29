import { Ionicons } from "@expo/vector-icons";
import type { RouteContextResponse } from "@depaso/validation";
import { ScrollView, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface SavedRoutesRowProps {
  presets: RouteContextResponse[];
  onApply: (preset: RouteContextResponse) => void;
  onDelete: (preset: RouteContextResponse) => void;
}

/** Fila horizontal con las rutas que el usuario guardó con nombre. */
export function SavedRoutesRow({ presets, onApply, onDelete }: SavedRoutesRowProps) {
  const colors = useColors();
  const styles = useStyles();
  if (presets.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Tus rutas guardadas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
        {presets.map((preset) => (
          <View key={preset.id} style={{ flexDirection: "row", alignItems: "center" }}>
            <AnimatedPressable
              accessibilityLabel={`Usar recorrido ${preset.name}`}
              haptic={false}
              onPress={() => onApply(preset)}
              style={styles.presetChip}
            >
              <Text style={styles.presetLabel}>{preset.name}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel={`Borrar la ruta guardada ${preset.name}`}
              haptic={false}
              onPress={() => onDelete(preset)}
              style={styles.presetDelete}
            >
              <Ionicons name="close" size={14} color={colors.text.secondary} />
            </AnimatedPressable>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
