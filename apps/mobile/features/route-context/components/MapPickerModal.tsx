import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { LocateButton } from "@/components/map/LocateButton";
import { MapPicker } from "@/components/map/MapPicker";
import { PlaceSearchBox } from "@/components/map/PlaceSearchBox";
import { useColors } from "@/lib/theme";
import { MAR_DEL_PLATA } from "../helpers";
import { useStyles } from "../styles";
import type { MapPicking } from "../useMapPicking";

type Point = { latitude: number; longitude: number };

interface MapPickerModalProps {
  /** Estado del mapa (abierto, punto elegido, órdenes para el mapa...) */
  picking: MapPicking;
  /** donde arranca centrado el mapa (la última parada, o Mar del Plata) */
  center: Point | undefined;
  name: string;
  onChangeName: (value: string) => void;
  onConfirm: () => void;
}

/**
 * Modal a pantalla completa para elegir un lugar: se busca por nombre o dirección (como en
 * Google Maps), se toca el mapa o se usa la ubicación actual.
 */
export function MapPickerModal({ picking, center, name, onChangeName, onConfirm }: MapPickerModalProps) {
  const colors = useColors();
  const styles = useStyles();
  const { picked } = picking;

  const pickedText = !picked
    ? "Buscá un lugar, o tocá el mapa donde vas a estar. Podés arrastrar el pin."
    : picking.isResolving
      ? "Buscando la dirección…"
      : (picking.pickedAddress ?? "Punto elegido en el mapa");

  return (
    <Modal visible={picking.isOpen} animationType="slide" onRequestClose={picking.close}>
      <SafeAreaView style={styles.mapModal} edges={["top", "bottom"]}>
        <View style={styles.navHeader}>
          <AnimatedPressable accessibilityLabel="Cerrar el mapa" haptic={false} onPress={picking.close} style={styles.backButton}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </AnimatedPressable>
          <Text style={styles.navTitle}>Elegí el lugar</Text>
        </View>

        <PlaceSearchBox near={picking.userLocation} onSelect={picking.pickFromSearch} style={styles.mapSearch} />

        <View style={styles.mapArea}>
          {picking.token ? (
            <MapPicker
              mapboxToken={picking.token}
              center={center ?? MAR_DEL_PLATA}
              onPick={(point) => void picking.pick(point)}
              focus={picking.focus}
              placePin={picking.placePin}
              userLocation={picking.userLocation}
            />
          ) : (
            <ActivityIndicator style={styles.mapLoader} color={colors.text.primary} />
          )}
          <LocateButton onLocated={picking.showUser} style={styles.mapLocate} />
        </View>

        <View style={styles.mapFooter}>
          <View style={styles.pickedRow}>
            <Ionicons name="location-outline" size={20} color={colors.text.primary} />
            <Text style={styles.pickedText} numberOfLines={2}>
              {pickedText}
            </Text>
          </View>
          <FormField label="Nombre (opcional)" value={name} onChangeText={onChangeName} placeholder="Médico, Shopping..." />
          <Button label="Agregar este lugar" onPress={onConfirm} disabled={!picked || picking.isResolving} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
