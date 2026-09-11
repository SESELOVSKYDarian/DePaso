import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@depaso/design-tokens";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Primitivo reutilizable de bottom sheet (sección 25/74). `Modal` nativo +
 * `animationType="slide"` — liviano, sin gesture-driven drag-to-dismiss todavía (eso
 * necesitaría `react-native-gesture-handler` + `Animated.ScrollTo` coordinado, que no
 * amerita la complejidad extra hasta tener más de un caso de uso que lo pida).
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 19, 65, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "80%",
  },
});
