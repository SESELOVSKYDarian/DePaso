import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Checkbox } from "@/components/common/Checkbox";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { makeStyles } from "@/lib/theme";
import { pesos, priceMeta, type PlanItem, type PlanStop } from "../helpers";

interface PurchaseItemRowProps {
  stop: PlanStop;
  item: PlanItem;
  checked: boolean;
  onToggle: () => void;
}

/** Un producto de la compra: casilla, foto, cantidad, de dónde sale el precio y cuánto cuesta. */
export function PurchaseItemRow({ stop, item, checked, onToggle }: PurchaseItemRowProps) {
  const styles = useStyles();

  // lleva a reportar el precio de este producto en este comercio
  const reportPrice = () =>
    router.push({
      pathname: "/report-price",
      params: {
        productVariantId: item.productVariantId!,
        storeBranchId: stop.storeBranchId,
        productName: item.productName,
        storeName: `${stop.storeName} ${stop.branchName}`,
        currentPrice: String(item.unitPrice),
      },
    });

  return (
    <Checkbox checked={checked} onToggle={onToggle} accessibilityLabel={`Marcar ${item.productName} como comprado`}>
      <View style={styles.row}>
        <ProductThumb name={item.productName} size={44} />
        <View style={styles.info}>
          <Text style={[styles.name, checked ? styles.done : null]}>
            {item.quantity} × {item.productName}
          </Text>
          <Text style={styles.meta}>{priceMeta(item)}</Text>
          {item.communityObserved ? (
            <Text style={styles.observed}>
              Otros usuarios lo vieron a ~{pesos(item.communityObserved.median)} ({item.communityObserved.count}{" "}
              {item.communityObserved.count === 1 ? "reporte" : "reportes"})
            </Text>
          ) : null}
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.price}>{pesos(item.unitPrice * item.quantity)}</Text>
          {item.productVariantId ? (
            <AnimatedPressable accessibilityLabel={`Reportar precio de ${item.productName}`} haptic={false} onPress={reportPrice} style={styles.report}>
              <Text style={styles.reportText}>Reportar</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </Checkbox>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
    info: { flex: 1, gap: 1 },
    name: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    done: { textDecorationLine: "line-through", color: colors.text.secondary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.muted },
    observed: { fontFamily: typography.itemTitle.fontFamily, fontSize: 11, color: colors.state.warning },
    priceColumn: { alignItems: "flex-end", gap: 2 },
    price: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    report: { minHeight: 28, justifyContent: "center" },
    reportText: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary, textDecorationLine: "underline" },
  }),
);
