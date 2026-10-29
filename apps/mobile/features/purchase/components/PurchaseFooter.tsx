import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { Button } from "@/components/common/Button";
import { makeStyles, useColors } from "@/lib/theme";
import { pesos } from "../helpers";

interface PurchaseFooterProps {
  completed: number;
  total: number;
  /** Lo que suman los productos ya tildados. */
  doneAmount: number;
  allDone: boolean;
  isLastStore: boolean;
  onNextStore: () => void;
  onFinish: () => void;
}

/** Barra de abajo: cuántos productos van, cuánto suman y el botón para seguir o terminar. */
export function PurchaseFooter({ completed, total, doneAmount, allDone, isLastStore, onNextStore, onFinish }: PurchaseFooterProps) {
  const styles = useStyles();
  const colors = useColors();
  const finishing = allDone || isLastStore;

  return (
    <View style={styles.bar}>
      <View>
        <Text style={styles.count}>
          {completed}/{total} productos
        </Text>
        <Text style={styles.amount}>{pesos(doneAmount)}</Text>
      </View>
      <Button
        label={finishing ? "Finalizar compra" : "Siguiente comercio"}
        variant="lime"
        disabled={finishing && !allDone}
        onPress={finishing ? onFinish : onNextStore}
        icon={finishing ? undefined : <Ionicons name="arrow-forward" size={18} color={colors.text.onLime} />}
        style={styles.button}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      backgroundColor: colors.surface.base,
    },
    count: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    amount: { fontFamily: typography.heroTitle.fontFamily, fontSize: 22, color: colors.text.primary },
    button: { flexShrink: 1, minWidth: 190 },
  }),
);
