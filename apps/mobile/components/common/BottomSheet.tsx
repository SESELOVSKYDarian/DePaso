import type { ReactNode } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { radii, spacing } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { ModalBackdrop } from "./ModalBackdrop";

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
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* Tocar el fondo (oscuro y desenfocado) cierra la hoja. */}
      <ModalBackdrop onPress={onClose} style={styles.backdrop}>
        <View style={styles.sheet}>{children}</View>
      </ModalBackdrop>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
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
}));
