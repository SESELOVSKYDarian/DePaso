import type { AdResponse } from "@depaso/validation";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { PromptModal } from "@/components/common/PromptModal";
import { pesos } from "@/features/merchant-ads/AdStatusCard";
import { makeStyles } from "@/lib/theme";

const DAYS = [7, 15, 30];

interface AdDecisionPanelProps {
  ad: AdResponse;
  busy: boolean;
  /** Aprueba con el monto y los días acordados. */
  onApprove: (amountText: string, days: number) => void;
  /** Propone otro monto: el comercio lo recibe y puede aceptarlo, rechazarlo o contraproponer. */
  onCounter: (amountText: string, days: number, note: string) => void;
  /** Rechaza con un motivo que ve el comercio. */
  onReject: (note: string) => void;
}

/** Las tres cosas que puede hacer el administrador con un pedido: aprobarlo, proponer otro monto o rechazarlo. */
export function AdDecisionPanel({ ad, busy, onApprove, onCounter, onReject }: AdDecisionPanelProps) {
  const styles = useStyles();
  const [days, setDays] = useState(ad.durationDays);
  const [mode, setMode] = useState<"counter" | "reject" | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Duración</Text>
      <View style={styles.days}>
        {DAYS.map((value) => {
          const selected = days === value;
          return (
            <AnimatedPressable key={value} accessibilityLabel={`${value} días`} haptic={false} onPress={() => setDays(value)} style={[styles.dayChip, selected ? styles.dayChipSelected : null]}>
              <Text style={[styles.dayText, selected ? styles.dayTextSelected : null]}>{value} días</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <Button label={busy ? "Guardando…" : `Aprobar por ${pesos(ad.offeredAmount)}`} onPress={() => onApprove(String(ad.offeredAmount), days)} loading={busy} />
      <View style={styles.row}>
        <Button label="Proponer otro monto" variant="secondary" onPress={() => setMode("counter")} style={styles.half} />
        <Button label="Rechazar" variant="ghost" onPress={() => setMode("reject")} style={styles.half} />
      </View>

      <PromptModal
        visible={mode === "counter"}
        title="Proponer otro monto"
        description={`${ad.merchantName ?? "El comercio"} ofrece ${pesos(ad.offeredAmount)}. Le llega tu propuesta y puede aceptarla, rechazarla o proponer otro monto.`}
        confirmLabel="Enviar propuesta"
        onConfirm={() => {
          onCounter(counterAmount, days, note);
          setMode(null);
        }}
        onCancel={() => setMode(null)}
      >
        <FormField label="Monto que proponés (pesos)" value={counterAmount} onChangeText={setCounterAmount} keyboardType="numeric" placeholder={String(Math.round(ad.offeredAmount))} />
        <FormField label="Mensaje para el comercio (opcional)" value={note} onChangeText={setNote} placeholder="Ej.: Por 30 días en Inicio el valor es este" multiline maxLength={300} />
      </PromptModal>

      <PromptModal
        visible={mode === "reject"}
        title="Rechazar pedido"
        description="El comercio ve el motivo. Si solo querés otro precio, usá “Proponer otro monto”."
        confirmLabel="Rechazar"
        confirmVariant="danger"
        onConfirm={() => {
          if (!reason.trim()) return;
          onReject(reason.trim());
          setMode(null);
        }}
        onCancel={() => setMode(null)}
      >
        <FormField label="Motivo" value={reason} onChangeText={setReason} placeholder="Ej.: El texto no se entiende" multiline maxLength={300} />
      </PromptModal>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: spacing.sm, marginTop: spacing.sm },
    label: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary },
    days: { flexDirection: "row", gap: spacing.sm },
    dayChip: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.surface.input, borderWidth: 1, borderColor: colors.border.subtle },
    dayChipSelected: { backgroundColor: colors.brand.navy, borderColor: colors.brand.navy },
    dayText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.primary },
    dayTextSelected: { color: colors.text.onNavy },
    row: { flexDirection: "row", gap: spacing.sm },
    half: { flex: 1 },
  }),
);
