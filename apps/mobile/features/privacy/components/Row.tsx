import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useStyles } from "../styles";

export function Row({
  icon,
  label,
  description,
  actionLabel,
  onPress,
  loading = false,
  disabled = false,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.state.error : colors.text.secondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <AnimatedPressable
        accessibilityLabel={label}
        haptic={false}
        onPress={disabled || loading ? undefined : onPress}
        style={[styles.actionButton, destructive && styles.actionButtonDanger, (disabled || loading) && styles.actionButtonDisabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={destructive ? colors.state.error : colors.text.primary} />
        ) : (
          <Text style={[styles.actionLabel, destructive && styles.actionLabelDanger]}>{actionLabel}</Text>
        )}
      </AnimatedPressable>
    </View>
  );
}
