import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useColors } from "@/lib/theme";
import { useStyles } from "../styles";

interface AddTodaySheetProps {
  visible: boolean;
  name: string;
  address: string;
  error: string | undefined;
  isGeocoding: boolean;
  onChangeName: (value: string) => void;
  onChangeAddress: (value: string) => void;
  onPickOnMap: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

/** Hoja para sumar un lugar de hoy: elegirlo en el mapa o escribir la dirección. */
export function AddTodaySheet(props: AddTodaySheetProps) {
  const colors = useColors();
  const styles = useStyles();

  return (
    <BottomSheet visible={props.visible} onClose={props.onClose}>
      <Text style={styles.sheetTitle}>Agregar lugar de hoy</Text>
      <AnimatedPressable accessibilityLabel="Elegir el lugar en el mapa" haptic={false} onPress={props.onPickOnMap} style={styles.mapOption}>
        <Ionicons name="map-outline" size={20} color={colors.text.primary} />
        <Text style={styles.placeName}>Elegir en el mapa</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
      </AnimatedPressable>
      <Text style={styles.orLabel}>o escribí la dirección</Text>
      <FormField label="Nombre (opcional)" value={props.name} onChangeText={props.onChangeName} placeholder="Médico, Shopping..." />
      <FormField
        label="Dirección"
        value={props.address}
        onChangeText={props.onChangeAddress}
        placeholder="Calle y altura, barrio"
        error={props.error}
      />
      <Button label={props.isGeocoding ? "Buscando dirección..." : "Agregar"} onPress={props.onSubmit} disabled={props.isGeocoding} />
    </BottomSheet>
  );
}
