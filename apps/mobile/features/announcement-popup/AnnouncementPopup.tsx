import type { AnnouncementPopup as PopupData } from "@depaso/validation";
import { Modal, StyleSheet } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { ModalBackdrop } from "@/components/common/ModalBackdrop";
import { spacing } from "@depaso/design-tokens";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementPopupProps {
  /** `null` = cerrada */
  announcement: PopupData | null;
  onClose: () => void;
}

/** Ventana que se abre al entrar a la app con el anuncio vigente. Se cierra con la cruz o con "Entendido". */
export function AnnouncementPopup({ announcement, onClose }: AnnouncementPopupProps) {
  return (
    <Modal visible={announcement !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* tocar afuera también cierra: siempre hay una salida */}
      <ModalBackdrop style={styles.backdrop} onPress={onClose}>
        {announcement ? (
          <Animated.View entering={ZoomIn.springify().damping(16).stiffness(180)} style={styles.holder}>
            <AnnouncementCard title={announcement.title} body={announcement.body} emoji={announcement.emoji} imageUri={announcement.imageData} onClose={onClose} />
          </Animated.View>
        ) : null}
      </ModalBackdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", justifyContent: "center", padding: spacing.lg },
  holder: { width: "100%", alignItems: "center" },
});
