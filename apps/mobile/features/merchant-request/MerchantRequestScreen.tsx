import type { ClaimableBranch, MerchantRequestResponse } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useToast } from "@/components/common/Toast";
import { geocodeClient, merchantClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { useColors } from "@/lib/theme";
import { ClaimForm } from "./components/ClaimForm";
import { NewBusinessForm } from "./components/NewBusinessForm";
import { RequestStatus } from "./components/RequestStatus";
import { useStyles } from "./styles";
import { useContactFields } from "./useContactFields";

type Mode = "claim" | "new";

/** Un usuario común pide pasar a rol comercio; un admin lo aprueba o rechaza. */
export default function MerchantRequestScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { show: showToast } = useToast();
  const { refreshUser } = useAuth();
  const contact = useContactFields();

  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState<MerchantRequestResponse | null>(null);
  const [mode, setMode] = useState<Mode>("claim");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | undefined>();

  // traigo la solicitud actual (si ya había una); si la aprobaron, refresco el rol del usuario
  const load = useCallback(async () => {
    try {
      const { request } = await merchantClient.myRequest();
      setCurrent(request);
      if (request?.status === "APPROVED") await refreshUser();
    } catch {
      showToast("No pudimos cargar tu solicitud.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  // envía la solicitud; `build` arma los datos (puede fallar si no se ubica la dirección)
  const send = async (build: () => Promise<Parameters<typeof merchantClient.submitRequest>[0] | null>) => {
    setIsSubmitting(true);
    setAddressError(undefined);
    try {
      const body = await build();
      if (!body) return;
      const { request } = await merchantClient.submitRequest(body);
      setCurrent(request);
      showToast("Solicitud enviada. Un administrador la va a revisar.", "success");
    } catch {
      showToast("No pudimos enviar la solicitud. Probá de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactData = () => ({ phone: contact.phone.trim(), contactEmail: contact.contactEmail.trim() });

  // pedir administrar una sucursal que ya está cargada
  const submitClaim = (branch: ClaimableBranch) => {
    if (!contact.validate()) return;
    void send(async () => ({
      businessName: `${branch.storeName} ${branch.name}`.trim().slice(0, 80),
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
      storeBranchId: branch.id,
      ...contactData(),
    }));
  };

  // pedir un comercio nuevo: primero se ubica la dirección en el mapa
  const submitNew = (data: { businessName: string; address: string; note: string }) => {
    void send(async () => {
      let coords: { latitude: number; longitude: number };
      try {
        coords = await geocodeClient.forward({ address: data.address });
      } catch {
        setAddressError("No pudimos ubicar esa dirección. Probá con calle, número y ciudad.");
        return null;
      }
      return {
        businessName: data.businessName,
        address: data.address,
        ...contactData(),
        ...(data.note ? { note: data.note } : {}),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.navy} />
      </View>
    );
  }

  if (current?.status === "PENDING" || current?.status === "APPROVED") {
    return <RequestStatus request={current} onRefresh={() => void load()} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {current?.status === "REJECTED" ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Tu solicitud anterior fue rechazada</Text>
          <Text style={styles.statusBody}>
            {current.rejectionReason ? `Motivo: ${current.rejectionReason}. ` : ""}Podés corregir los datos y volver a
            enviarla.
          </Text>
        </View>
      ) : (
        <Text style={styles.intro}>
          Si tenés un comercio y querés publicar tus productos y precios en DePaso, completá estos datos. Un
          administrador revisa la solicitud y, si la aprueba, tu cuenta pasa a ser de comercio.
        </Text>
      )}

      <View style={styles.tabs}>
        {(["claim", "new"] as const).map((value) => (
          <AnimatedPressable
            key={value}
            accessibilityLabel={value === "claim" ? "Mi comercio ya aparece en DePaso" : "Es un comercio nuevo"}
            haptic={false}
            onPress={() => setMode(value)}
            style={[styles.tab, mode === value ? styles.tabSelected : null]}
          >
            <Text style={[styles.tabLabel, mode === value ? styles.tabLabelSelected : null]}>
              {value === "claim" ? "Ya aparece en DePaso" : "Es nuevo"}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      {mode === "claim" ? (
        <ClaimForm contact={contact} isSubmitting={isSubmitting} onSubmit={submitClaim} />
      ) : (
        <NewBusinessForm contact={contact} isSubmitting={isSubmitting} addressError={addressError} onSubmit={submitNew} />
      )}
    </ScrollView>
  );
}
