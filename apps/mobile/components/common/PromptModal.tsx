import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { Button } from "./Button";
import { ModalBackdrop } from "./ModalBackdrop";

interface PromptModalProps {
  visible: boolean;
  title: string;
  description?: string;
  /** Los campos que se piden (montos, motivo…). */
  children: ReactNode;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Ventana centrada para pedir un dato (un monto, un motivo) antes de confirmar una acción. */
export function PromptModal({ visible, title, description, children, confirmLabel, confirmVariant = "primary", loading = false, onConfirm, onCancel }: PromptModalProps) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <ModalBackdrop style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.avoid}>
          <View style={styles.card}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <Text style={styles.title}>{title}</Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}
              {children}
              <View style={styles.actions}>
                <Button label="Cancelar" variant="ghost" onPress={onCancel} style={styles.action} />
                <Button label={confirmLabel} variant={confirmVariant} onPress={onConfirm} loading={loading} style={styles.action} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </ModalBackdrop>
    </Modal>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
    avoid: { width: "100%", alignItems: "center" },
    card: { width: "100%", maxWidth: 380, maxHeight: "90%", backgroundColor: colors.surface.primary, borderRadius: radii.lg },
    body: { gap: spacing.sm, padding: spacing.lg },
    title: { fontFamily: typography.title.fontFamily, fontSize: 18, color: colors.text.primary },
    description: { fontFamily: typography.bodyRegular.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
    action: { flex: 1 },
  }),
);
