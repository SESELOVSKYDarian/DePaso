import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { Checkbox } from "@/components/common/Checkbox";
import { ProductThumb } from "@/components/lists/ProductThumb";
import { isItemDone, missingUnits, type ItemProgress } from "@/lib/purchase/progress";
import { makeStyles } from "@/lib/theme";
import { pesos, priceMeta, type PlanItem, type PlanStop } from "../helpers";
import { QuantityStepper } from "./QuantityStepper";
import { SoldOutSuggestions } from "./SoldOutSuggestions";

interface PurchaseItemRowProps {
  stop: PlanStop;
  item: PlanItem;
  progress: ItemProgress | undefined;
  /** Anota cuántas unidades se compraron. */
  onSetBought: (bought: number) => void;
  /** Marca (o desmarca) que en este comercio no había más. */
  onSetSoldOut: (soldOut: boolean) => void;
}

/**
 * Un producto de la compra: casilla, foto, cantidad pedida, de dónde sale el precio y cuánto cuesta.
 * Se puede anotar cuántas unidades se llevan de verdad y marcar "No hay más": en ese caso aparece
 * dónde conseguir las que faltan, lo más barato y cercano.
 */
export function PurchaseItemRow({ stop, item, progress, onSetBought, onSetSoldOut }: PurchaseItemRowProps) {
  const styles = useStyles();
  const bought = progress?.bought ?? 0;
  const soldOut = progress?.soldOut ?? false;
  const allBought = bought >= item.quantity;
  const done = isItemDone(progress, item.quantity);
  const missing = missingUnits(progress, item.quantity);
  // lo que suma este producto: lo que se compró, o lo planeado si todavía no se empezó
  const amount = item.unitPrice * (bought > 0 || soldOut ? bought : item.quantity);

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
    <View style={styles.wrap}>
      <Checkbox checked={allBought} onToggle={() => onSetBought(allBought ? 0 : item.quantity)} accessibilityLabel={`Marcar ${item.productName} como comprado`}>
        <View style={styles.row}>
          <ProductThumb name={item.productName} size={44} />
          <View style={styles.info}>
            <Text style={[styles.name, done ? styles.done : null]}>
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
            <Text style={styles.price}>{pesos(amount)}</Text>
            {item.productVariantId ? (
              <AnimatedPressable accessibilityLabel={`Reportar precio de ${item.productName}`} haptic={false} onPress={reportPrice} style={styles.report}>
                <Text style={styles.reportText}>Reportar</Text>
              </AnimatedPressable>
            ) : null}
          </View>
        </View>
      </Checkbox>

      {allBought ? null : (
        <View style={styles.controls}>
          {item.quantity > 1 && !soldOut ? (
            <QuantityStepper value={bought} max={item.quantity} productName={item.productName} onChange={onSetBought} />
          ) : null}
          {soldOut ? (
            <Text style={styles.soldOut}>
              Sin stock acá{bought > 0 ? ` · compraste ${bought}` : ""} · faltan {missing}
            </Text>
          ) : null}
          <AnimatedPressable
            accessibilityLabel={soldOut ? `Volver a buscar ${item.productName} acá` : `No hay más ${item.productName}`}
            haptic={false}
            onPress={() => onSetSoldOut(!soldOut)}
            style={styles.soldOutButton}
          >
            <Text style={styles.soldOutButtonText}>{soldOut ? "Sí había" : "No hay más"}</Text>
          </AnimatedPressable>
        </View>
      )}

      {soldOut && missing > 0 ? <SoldOutSuggestions stop={stop} item={item} missing={missing} /> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: spacing.xs },
    row: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
    info: { flex: 1, gap: 1 },
    name: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    done: { textDecorationLine: "line-through", color: colors.text.secondary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.muted },
    observed: { fontFamily: typography.itemTitle.fontFamily, fontSize: 11, color: colors.state.warning },
    priceColumn: { alignItems: "flex-end", gap: 2 },
    price: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
    report: { minHeight: 44, minWidth: 64, alignItems: "flex-end", justifyContent: "center" },
    reportText: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary, textDecorationLine: "underline" },
    controls: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.xs, paddingLeft: spacing.xs },
    soldOut: { flex: 1, fontFamily: typography.itemTitle.fontFamily, fontSize: 12, color: colors.state.warning },
    soldOutButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radii.full, borderWidth: 1, borderColor: colors.border.strong },
    soldOutButtonText: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary },
  }),
);