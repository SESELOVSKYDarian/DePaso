import type { AdResponse } from "@depaso/validation";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { PromptModal } from "@/components/common/PromptModal";
import { pesos } from "./AdStatusCard";

interface CounterActionsProps {
  ad: AdResponse;
  /** Precio mínimo para este pedido con los precios vigentes. */
  minimum: number;
  onReply: (answer: "ACCEPT" | "DECLINE" | "PROPOSE", amount?: string) => Promise<boolean>;
}

/** Lo que puede hacer el comercio cuando el equipo le propone otro monto: aceptar, rechazar o contraproponer. */
export function CounterActions({ ad, minimum, onReply }: CounterActionsProps) {
  const [proposing, setProposing] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const answer = async (reply: "ACCEPT" | "DECLINE" | "PROPOSE", value?: string) => {
    setBusy(true);
    const ok = await onReply(reply, value);
    setBusy(false);
    if (ok) setProposing(false);
  };

  return (
    <View style={styles.wrap}>
      <Button label={`Aceptar ${pesos(ad.counterAmount ?? 0)}`} loading={busy} onPress={() => void answer("ACCEPT")} />
      <View style={styles.row}>
        <Button label="Proponer otro monto" variant="secondary" onPress={() => setProposing(true)} style={styles.half} />
        <Button label="Rechazar" variant="ghost" onPress={() => void answer("DECLINE")} style={styles.half} />
      </View>

      <PromptModal
        visible={proposing}
        title="Proponer otro monto"
        description={`El equipo propone ${pesos(ad.counterAmount ?? 0)}. Tu propuesta no puede ser menor a ${pesos(minimum)} (precio base por ${ad.durationDays} días).`}
        confirmLabel="Enviar propuesta"
        loading={busy}
        onConfirm={() => void answer("PROPOSE", amount)}
        onCancel={() => setProposing(false)}
      >
        <FormField label="Tu monto en pesos" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={String(Math.round(minimum))} />
      </PromptModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  half: { flex: 1 },
});
