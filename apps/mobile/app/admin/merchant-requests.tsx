import type { AdminMerchantRequestResponse } from "@depaso/validation";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { EmptyState } from "@/components/EmptyState";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { adminMerchantClient } from "@/lib/apiClient";

/** Bandeja del admin: solicitudes de usuarios que quieren pasar a rol comercio. */
export default function AdminMerchantRequestsScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { show: showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<AdminMerchantRequestResponse[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Pedidos cuyo vínculo con el comercio ya se confirmó por teléfono o correo.
  const [verifiedIds, setVerifiedIds] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const { requests: pending } = await adminMerchantClient.list("PENDING");
      setRequests(pending);
    } catch {
      showToast("No pudimos cargar las solicitudes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const decide = async (id: string, decision: "APPROVE" | "REJECT") => {
    if (decision === "REJECT" && !reason.trim()) {
      showToast("Indicá el motivo del rechazo.", "info");
      return;
    }
    setBusyId(id);
    try {
      await adminMerchantClient.decide(id, {
        decision,
        ...(decision === "REJECT" ? { reason: reason.trim() } : { contactVerified: verifiedIds[id] === true }),
      });
      showToast(decision === "APPROVE" ? "Comercio aprobado" : "Solicitud rechazada", "success");
      setRejectingId(null);
      setReason("");
      await load();
    } catch {
      showToast("No pudimos resolver la solicitud.", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.navy} />
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState emoji="✅" title="Sin solicitudes pendientes" description="Cuando un usuario pida ser comercio va a aparecer acá." />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.businessName}</Text>
          <Text style={styles.meta}>{item.address}</Text>
          <Text style={styles.meta}>
            {item.storeBranchId
              ? "Pide administrar una sucursal que ya está en DePaso (importada)."
              : "Comercio nuevo: al aprobar se crea su sucursal."}
          </Text>
          <Text style={styles.contactTitle}>Contacto para verificar</Text>
          {item.phone ? (
            <Button label={`Llamar · ${item.phone}`} variant="secondary" onPress={() => void Linking.openURL(`tel:${item.phone}`)} />
          ) : (
            <Text style={styles.meta}>Sin teléfono (pedido anterior).</Text>
          )}
          {item.contactEmail ? (
            <Button
              label={`Escribir · ${item.contactEmail}`}
              variant="secondary"
              onPress={() => void Linking.openURL(`mailto:${item.contactEmail}?subject=Tu alta en DePaso`)}
            />
          ) : null}
          <Text style={styles.meta}>
            Solicita: {item.userDisplayName ? `${item.userDisplayName} · ` : ""}
            {item.userEmail}
          </Text>
          {item.note ? <Text style={styles.note}>&quot;{item.note}&quot;</Text> : null}

          {rejectingId === item.id ? (
            <>
              <FormField label="Motivo del rechazo" value={reason} onChangeText={setReason} autoCapitalize="sentences" />
              <View style={styles.actions}>
                <Button label="Cancelar" variant="secondary" style={styles.action} onPress={() => setRejectingId(null)} />
                <Button label="Rechazar" variant="danger" style={styles.action} loading={busyId === item.id} onPress={() => void decide(item.id, "REJECT")} />
              </View>
            </>
          ) : (
            <>
              <Checkbox
                checked={verifiedIds[item.id] === true}
                onToggle={(value) => setVerifiedIds((current) => ({ ...current, [item.id]: value }))}
                accessibilityLabel="Confirmo que verifiqué que trabaja en el comercio"
              >
                <Text style={styles.meta}>Ya me comuniqué y confirmé que trabaja en este comercio.</Text>
              </Checkbox>
            <View style={styles.actions}>
              <Button label="Rechazar" variant="secondary" style={styles.action} onPress={() => setRejectingId(item.id)} />
              <Button
                label="Aprobar"
                style={styles.action}
                loading={busyId === item.id}
                disabled={verifiedIds[item.id] !== true}
                onPress={() => void decide(item.id, "APPROVE")}
              />
            </View>
            </>
          )}
        </View>
      )}
    />
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: { fontFamily: typography.heroTitle.fontFamily, fontSize: 18, color: colors.text.primary },
  meta: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
  contactTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary, marginTop: spacing.xs },
  note: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
}));
