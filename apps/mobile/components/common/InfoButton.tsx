import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "./AnimatedPressable";
import { Button } from "./Button";
import { ModalBackdrop } from "./ModalBackdrop";

interface InfoButtonProps {
  title: string;
  /** Un párrafo por ítem. */
  lines: string[];
}

/** Botón "i": la aclaración queda guardada y aparece solo al tocarlo, para no llenar la pantalla de texto. */
export function InfoButton({ title, lines }: InfoButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnimatedPressable
        accessibilityLabel={`Más información: ${title}`}
        haptic={false}
        onPress={() => setOpen(true)}
        style={styles.button}
      >
        <Ionicons name="information-circle-outline" size={22} color={colors.text.secondary} />
      </AnimatedPressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <ModalBackdrop style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {lines.map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
            <Button label="Entendido" onPress={() => setOpen(false)} />
          </View>
        </ModalBackdrop>
      </Modal>
    </>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    button: { alignItems: "center", justifyContent: "center", width: 40, height: 40 },
    backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
    card: { width: "100%", maxWidth: 360, gap: spacing.sm, backgroundColor: colors.surface.primary, borderRadius: radii.lg, padding: spacing.lg },
    title: { fontFamily: typography.title.fontFamily, fontSize: 18, color: colors.text.primary },
    line: { fontFamily: typography.bodyRegular.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
  }),
);
