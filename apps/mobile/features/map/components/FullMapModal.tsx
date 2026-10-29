import { Ionicons } from "@expo/vector-icons";
import type { NearbyStore, OptimizationPlanResponse } from "@depaso/validation";
import { Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { RouteMapView } from "@/components/map/RouteMapView";
import { useColors } from "@/lib/theme";
import { formatBlocks, formatDetour } from "../helpers";
import { useStyles } from "../styles";

type PlanStop = OptimizationPlanResponse["stops"][number];

interface FullMapModalProps {
  visible: boolean;
  mapProps: React.ComponentProps<typeof RouteMapView>;
  selectedStop: PlanStop | null;
  selectedStore: NearbyStore | null;
  onClose: () => void;
}

/** Mapa a pantalla completa, con una tarjeta del comercio elegido. */
export function FullMapModal({ visible, mapProps, selectedStop, selectedStore, onClose }: FullMapModalProps) {
  const s = useStyles();
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.fullMap} edges={["top", "bottom"]}>
        <RouteMapView {...mapProps} fill />
        <AnimatedPressable accessibilityLabel="Cerrar el mapa" onPress={onClose} style={s.closeMap}>
          <Ionicons name="close" size={22} color={colors.text.primary} />
        </AnimatedPressable>
        {selectedStop || selectedStore ? (
          <View style={s.fullMapCard}>
            <Text style={s.storeName}>{(selectedStop ?? selectedStore)!.storeName}</Text>
            <Text style={s.address} numberOfLines={1}>
              {selectedStop ? (selectedStop.address ?? selectedStop.branchName) : selectedStore!.address}
            </Text>
            <Text style={s.detourStrong}>
              {selectedStop ? formatBlocks(selectedStop.distanceFromRouteMeters) : formatDetour(selectedStore!)}
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
