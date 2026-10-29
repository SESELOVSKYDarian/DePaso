import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

/** Pie de la lista: botones para sumar un producto a mano o armar la lista con IA. */
export function ListFooter({ listId }: { listId: string }) {
  const colors = useColors();
  const styles = useStyles();
  // Desde Android 15 la app se dibuja bajo la barra de navegación: sin este margen el pie
  // (con los botones de agregar y de IA) queda tapado por el sistema.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}>
      <View style={styles.addRow}>
        <AnimatedPressable
          accessibilityLabel="Sumar un producto"
          onPress={() => router.push({ pathname: "/lists/search", params: { listId } })}
          style={[styles.addButton, styles.addButtonGrow]}
        >
          <Ionicons name="add" size={20} color={colors.text.onNavy} />
          <Text style={styles.addLabel}>Sumar producto</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Armar la lista con IA"
          onPress={() => router.push({ pathname: "/lists/assistant", params: { listId, autoStart: "1" } })}
          style={[styles.aiButton, styles.addButtonGrow]}
        >
          <Ionicons name="sparkles" size={18} color={colors.text.primary} />
          <Text style={styles.aiLabel}>Armar con IA</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
