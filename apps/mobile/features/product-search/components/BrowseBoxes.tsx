import { Ionicons } from "@expo/vector-icons";
import { PRODUCT_TYPE_GROUPS, PRODUCT_TYPE_LABELS } from "@depaso/domain";
import { Text, View } from "react-native";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useColors } from "@/lib/theme";
import { GROUP_ICONS } from "../helpers";
import { useStyles } from "../styles";

interface BrowseBoxesProps {
  /** categoría abierta (muestra sus tipos); `null` = se muestran las categorías */
  group: { id: string; typeIds: readonly string[] } | null;
  onPickGroup: (id: string) => void;
  onPickType: (id: string) => void;
}

/** Explorar sin escribir: cajas de categorías o, dentro de una, de tipos de producto. */
export function BrowseBoxes({ group, onPickGroup, onPickType }: BrowseBoxesProps) {
  const colors = useColors();
  const styles = useStyles();

  if (group) {
    return (
      <View style={styles.grid}>
        {group.typeIds.map((id) => (
          <AnimatedPressable key={id} accessibilityLabel={PRODUCT_TYPE_LABELS[id] ?? id} haptic={false} onPress={() => onPickType(id)} style={styles.box}>
            <Ionicons name={GROUP_ICONS[group.id] ?? "pricetag-outline"} size={24} color={colors.text.primary} />
            <Text style={styles.boxLabel} numberOfLines={2}>
              {PRODUCT_TYPE_LABELS[id] ?? id}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionLabel}>Explorá por categoría</Text>
      <View style={styles.grid}>
        {PRODUCT_TYPE_GROUPS.map((option) => (
          <AnimatedPressable key={option.id} accessibilityLabel={option.label} haptic={false} onPress={() => onPickGroup(option.id)} style={styles.box}>
            <Ionicons name={GROUP_ICONS[option.id] ?? "pricetag-outline"} size={26} color={colors.text.primary} />
            <Text style={styles.boxLabel} numberOfLines={2}>
              {option.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </>
  );
}
