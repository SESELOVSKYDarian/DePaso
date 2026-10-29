import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { MapPicker } from "@/components/map/MapPicker";
import type { MapFocus, MapPoint } from "@/lib/map/mapCommands";
import { makeStyles } from "@/lib/theme";

/** Mar del Plata: de acá arranca el mapa si todavía no se buscó nada. */
const MAR_DEL_PLATA: MapPoint = { latitude: -38.0055, longitude: -57.5426 };

interface ExploreMapProps {
  token: string | null;
  onPick: (point: MapPoint) => void;
  focus: MapFocus | null;
  userLocation: MapPoint | null;
  placePin: MapFocus | null;
}

/** Mapa para explorar sin recorrido armado: ocupa todo el espacio; se toca un punto o se usa el buscador. */
export function ExploreMap({ token, onPick, focus, userLocation, placePin }: ExploreMapProps) {
  const styles = useStyles();

  if (!token) {
    return (
      <View style={[styles.frame, styles.empty]}>
        <Text style={styles.emptyText}>El mapa necesita un token de Mapbox configurado en el servidor.</Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <MapPicker mapboxToken={token} center={MAR_DEL_PLATA} onPick={onPick} focus={focus} userLocation={userLocation} placePin={placePin} />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    frame: { flex: 1, backgroundColor: colors.surface.secondary },
    empty: { alignItems: "center", justifyContent: "center", padding: spacing.lg },
    emptyText: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, textAlign: "center" },
  }),
);
