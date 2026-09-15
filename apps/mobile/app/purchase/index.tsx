import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { PriceDisclosureBanner } from "@/components/PriceDisclosureBanner";
import { confidenceLabel, formatRecency, sourceTypeLabel } from "@/lib/priceDisclosure";
import { usePurchase } from "@/lib/purchase/PurchaseContext";

function priceMeta(item: { sourceType?: string; confidence?: string; reportedAt?: string }): string {
  const parts = [sourceTypeLabel(item.sourceType), confidenceLabel(item.confidence), formatRecency(item.reportedAt)].filter(
    (p): p is string => p !== null
  );
  return parts.join(" · ");
}

/** Fase 18: checklist por comercio de la opción elegida; el estado dura la compra actual. */
export default function PurchaseScreen() {
  const { plan, checked, toggle, finish } = usePurchase();
  if (!plan) return <SafeAreaView style={styles.container} edges={["top"]}><View style={styles.empty}><Text style={styles.title}>No hay una compra activa</Text><Button label="Ver mi Top 3" onPress={() => router.replace("/optimization")} /></View></SafeAreaView>;
  const items = plan.stops.flatMap((stop) => stop.items.map((item) => ({ key: `${stop.storeBranchId}:${item.productId}`, item })));
  const completed = items.filter(({ key }) => checked[key]).length;
  const allDone = completed === items.length;
  return <SafeAreaView style={styles.container} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.text.primary} /></AnimatedPressable><View><Text style={styles.eyebrow}>MODO COMPRA</Text><Text style={styles.title}>{completed} de {items.length} productos</Text></View></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${items.length ? (completed / items.length) * 100 : 0}%` }]} /></View>
    <PriceDisclosureBanner />
    {plan.stops.map((stop, stopIndex) => <View key={stop.storeBranchId} style={styles.store}><View style={styles.storeHeader}><View style={styles.number}><Text style={styles.numberText}>{stopIndex + 1}</Text></View><View><Text style={styles.storeName}>{stop.storeName}</Text><Text style={styles.branch}>{stop.branchName}</Text></View></View>{stop.items.map((item) => { const key = `${stop.storeBranchId}:${item.productId}`; return <Checkbox key={key} checked={!!checked[key]} onToggle={() => toggle(key)} accessibilityLabel={`Marcar ${item.productName} como comprado`}><View style={styles.item}><View style={styles.itemInfo}><Text style={[styles.itemName, checked[key] && styles.done]}>{item.quantity} × {item.productName}</Text><Text style={styles.itemMeta}>{priceMeta(item)}</Text></View><View style={styles.priceCol}><Text style={styles.price}>${item.unitPrice.toFixed(0)}</Text>{item.productVariantId ? <AnimatedPressable accessibilityLabel={`Reportar precio de ${item.productName}`} haptic={false} onPress={() => router.push({ pathname: "/report-price", params: { productVariantId: item.productVariantId!, storeBranchId: stop.storeBranchId, productName: item.productName, storeName: `${stop.storeName} ${stop.branchName}`, currentPrice: String(item.unitPrice) } })} style={styles.reportLink}><Text style={styles.reportLinkText}>Reportar</Text></AnimatedPressable> : null}</View></View></Checkbox>; })}</View>)}
    <Button label={allDone ? "Finalizar compra" : "Seguir comprando"} variant={allDone ? "lime" : "secondary"} disabled={!allDone} onPress={() => { finish(); router.replace("/(tabs)"); }} />
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container:{flex:1,backgroundColor:colors.surface.base},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{flexDirection:"row",alignItems:"center",gap:spacing.sm},back:{width:44,height:44,alignItems:"center",justifyContent:"center",borderRadius:radii.full,backgroundColor:colors.surface.primary,borderWidth:1,borderColor:colors.border.subtle},eyebrow:{fontFamily:typography.caption.fontFamily,fontSize:12,letterSpacing:1,color:colors.brand.accentDark},title:{fontFamily:typography.heroTitle.fontFamily,fontSize:24,color:colors.text.primary},progress:{height:8,borderRadius:radii.full,backgroundColor:colors.border.subtle,overflow:"hidden"},progressFill:{height:"100%",backgroundColor:colors.brand.accent},store:{gap:spacing.sm,padding:spacing.md,borderRadius:radii.xl,backgroundColor:colors.surface.primary,borderWidth:1,borderColor:colors.border.subtle},storeHeader:{flexDirection:"row",alignItems:"center",gap:spacing.sm},number:{width:28,height:28,borderRadius:radii.full,alignItems:"center",justifyContent:"center",backgroundColor:colors.brand.navy},numberText:{fontFamily:typography.itemTitle.fontFamily,fontSize:13,color:colors.text.onNavy},storeName:{fontFamily:typography.itemTitle.fontFamily,fontSize:16,color:colors.text.primary},branch:{fontFamily:typography.caption.fontFamily,fontSize:12,color:colors.text.secondary},item:{flex:1,flexDirection:"row",justifyContent:"space-between",gap:spacing.sm},itemInfo:{flex:1,gap:1},itemName:{fontFamily:typography.body.fontFamily,fontSize:14,color:colors.text.primary},itemMeta:{fontFamily:typography.caption.fontFamily,fontSize:11,color:colors.text.muted},done:{textDecorationLine:"line-through",color:colors.text.secondary},price:{fontFamily:typography.itemTitle.fontFamily,fontSize:14,color:colors.text.primary},priceCol:{alignItems:"flex-end",gap:2},reportLink:{minHeight:28,justifyContent:"center"},reportLinkText:{fontFamily:typography.caption.fontFamily,fontSize:11,color:colors.text.secondary,textDecorationLine:"underline"},empty:{flex:1,alignItems:"center",justifyContent:"center",padding:spacing.lg,gap:spacing.md} });
