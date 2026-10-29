import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { MapPicker } from "@/components/map/MapPicker";
import { useColors } from "@/lib/theme";
import { MAR_DEL_PLATA } from "../helpers";
import { useStyles } from "../styles";

type Point = { latitude: number; longitude: number };

interface MapPickerModalProps {
  visible: boolean;
  token: string | null;
  /** donde arranca centrado el mapa (la última parada, o Mar del Plata) */
  center: Point | undefined;
  picked: Point | null;
  pickedAddress: string | null;
  isResolving: boolean;
  name: string;
  onChangeName: (value: string) => void;
  onPick: (point: Point) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** Modal a pantalla completa para elegir un lugar tocando el mapa. */
export function MapPickerModal(props: MapPickerModalProps) {
  const colors = useColors();
  const styles = useStyles();
  const { picked } = props;

  const pickedText = !picked
    ? "Tocá el mapa donde vas a estar. Podés arrastrar el pin."
    : props.isResolving
      ? "Buscando la dirección…"
      : (props.pickedAddress ?? "Punto elegido en el mapa");

  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
      <SafeAreaView style={styles.mapModal} edges={["top", "bottom"]}>
        <View style={styles.navHeader}>
          <AnimatedPressable accessibilityLabel="Cerrar el mapa" haptic={false} onPress={props.onClose} style={styles.backButton}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </AnimatedPressable>
          <Text style={styles.navTitle}>Elegí el lugar</Text>
        </View>
        <View style={styles.mapArea}>
          {props.token ? (
            <MapPicker mapboxToken={props.token} center={props.center ?? MAR_DEL_PLATA} onPick={props.onPick} />
          ) : (
            <ActivityIndicator style={styles.mapLoader} color={colors.text.primary} />
          )}
        </View>
        <View style={styles.mapFooter}>
          <View style={styles.pickedRow}>
            <Ionicons name="location-outline" size={20} color={colors.text.primary} />
            <Text style={styles.pickedText} numberOfLines={2}>
              {pickedText}
            </Text>
          </View>
          <FormField label="Nombre (opcional)" value={props.name} onChangeText={props.onChangeName} placeholder="Médico, Shopping..." />
          <Button label="Agregar este lugar" onPress={props.onConfirm} disabled={!picked || props.isResolving} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
