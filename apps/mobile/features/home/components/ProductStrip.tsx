import type { HomeProduct } from "@depaso/validation";
import { useRef, useState, type ComponentRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Skeleton } from "@/components/common/Skeleton";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles } from "@/lib/theme";
import { ProductCard } from "./ProductCard";
import { StripArrows } from "./StripArrows";

interface ProductStripProps {
  title: string;
  subtitle: string;
  /** `null` mientras se cargan; con la lista vacía la tira no se muestra. */
  products: HomeProduct[] | null;
  /** Muestra "Ahorrás X%" (para la tira de baratos). */
  showSaving?: boolean;
  /** Se llama al tocar el "+" de un producto. */
  onAdd: (product: HomeProduct) => void;
}

const SKELETONS = [0, 1, 2];

/**
 * Tira horizontal de productos sugeridos (baratos hoy o recomendados), con un botón para sumarlos a
 * la lista. En computadora las tarjetas son más grandes y se recorre con flechas, que mueven
 * la tira de a una "página".
 */
export function ProductStrip({ title, subtitle, products, showSaving = false, onAdd }: ProductStripProps) {
  const styles = useStyles();
  const { contentWidth } = useBreakpoint();
  const large = contentWidth >= 980;
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  // dónde está la tira y cuánto mide, para saber si las flechas tienen a dónde ir
  const [offset, setOffset] = useState(0);
  const [viewWidth, setViewWidth] = useState(0);
  const [contentSize, setContentSize] = useState(0);
  if (products !== null && products.length === 0) return null;

  const page = Math.max(240, viewWidth * 0.8);
  const goTo = (x: number) => scroller.current?.scrollTo({ x: Math.max(0, x), animated: true });

  return (
    <View style={[styles.section, large ? styles.sectionLarge : null]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text accessibilityRole="header" style={[styles.title, large ? styles.titleLarge : null]}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {large ? (
          <StripArrows
            canGoBack={offset > 4}
            canGoForward={offset + viewWidth < contentSize - 4}
            onBack={() => goTo(offset - page)}
            onForward={() => goTo(offset + page)}
          />
        ) : null}
      </View>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, large ? styles.rowLarge : null]}
        scrollEventThrottle={32}
        onScroll={(event) => setOffset(event.nativeEvent.contentOffset.x)}
        onLayout={(event) => setViewWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentSize(width)}
      >
        {products === null
          ? SKELETONS.map((index) => <Skeleton key={index} width={large ? 224 : 156} height={large ? 280 : 190} borderRadius={radii.lg} />)
          : products.map((product) => <ProductCard key={product.productId} product={product} showSaving={showSaving} large={large} onAdd={onAdd} />)}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    sectionLarge: { gap: spacing.lg },
    head: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md },
    headText: { flex: 1 },
    title: { fontFamily: typography.screenTitle.fontFamily, fontSize: 20, color: colors.text.primary },
    titleLarge: { fontSize: 26, lineHeight: 32 },
    subtitle: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary, marginTop: 2 },
    row: { gap: spacing.md, paddingRight: spacing.lg },
    rowLarge: { gap: spacing.lg },
  }),
);