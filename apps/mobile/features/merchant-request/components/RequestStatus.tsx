import type { MerchantRequestResponse } from "@depaso/validation";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "@/components/common/Button";
import { useStyles } from "../styles";

/** Pantalla cuando ya hay una solicitud en revisión o aprobada. */
export function RequestStatus({ request, onRefresh }: { request: MerchantRequestResponse; onRefresh: () => void }) {
  const styles = useStyles();

  if (request.status === "PENDING") {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Solicitud en revisión</Text>
          <Text style={styles.statusBody}>
            Pediste ser comercio con el nombre &quot;{request.businessName}&quot;. Un administrador la va a revisar y
            cuando la apruebe tu cuenta pasa a ser de comercio.
          </Text>
        </View>
        <Button label="Actualizar estado" variant="secondary" onPress={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>¡Tu comercio fue aprobado!</Text>
        <Text style={styles.statusBody}>Ya podés cargar tus productos y precios.</Text>
      </View>
      <Button label="Ir a Mi comercio" onPress={() => router.replace("/merchant")} />
    </View>
  );
}
