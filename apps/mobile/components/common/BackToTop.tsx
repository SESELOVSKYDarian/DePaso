import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useCallback, useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  type FlatListProps,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { spacing } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "./AnimatedPressable";

/** Cuánto hay que bajar para que aparezca el botón. */
const SHOW_AFTER_PX = 480;

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

/** Botón redondo "volver arriba": aparece al bajar y lleva al principio de la pantalla. */
function BackToTopButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} pointerEvents="box-none" style={styles.wrap}>
      <AnimatedPressable accessibilityLabel="Volver arriba" haptic={false} onPress={onPress} style={styles.button}>
        <Ionicons name="arrow-up" size={22} color={colors.text.onNavy} />
      </AnimatedPressable>
    </Animated.View>
  );
}

/** Lleva la cuenta de cuánto se bajó y avisa si hay que mostrar el botón. */
function useShowAfterScroll(onScroll?: ScrollHandler) {
  const [visible, setVisible] = useState(false);
  const handle = useCallback<ScrollHandler>(
    (event) => {
      onScroll?.(event);
      const show = event.nativeEvent.contentOffset.y > SHOW_AFTER_PX;
      setVisible((current) => (current === show ? current : show));
    },
    [onScroll],
  );
  return { visible, handle };
}

/**
 * `ScrollView` con botón de volver arriba incluido: se usa igual que el de React Native. Los
 * horizontales pasan de largo (no tiene sentido volver "arriba" en una tira).
 */
export const BackToTopScrollView = forwardRef<ComponentRef<typeof ScrollView>, ScrollViewProps & { children?: ReactNode }>(function BackToTopScrollView(props, forwardedRef) {
  const styles = useStyles();
  const innerRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const { visible, handle } = useShowAfterScroll(props.onScroll as ScrollHandler | undefined);

  if (props.horizontal) return <ScrollView ref={forwardedRef} {...props} />;

  const setRef = (node: ComponentRef<typeof ScrollView> | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <View style={styles.fill}>
      <ScrollView {...props} ref={setRef} onScroll={handle} scrollEventThrottle={props.scrollEventThrottle ?? 16} />
      <BackToTopButton visible={visible} onPress={() => innerRef.current?.scrollTo({ y: 0, animated: true })} />
    </View>
  );
});

/** `FlatList` con botón de volver arriba incluido. */
export function BackToTopFlatList<T>(props: FlatListProps<T>) {
  const styles = useStyles();
  const ref = useRef<FlatList<T> | null>(null);
  const { visible, handle } = useShowAfterScroll(props.onScroll as ScrollHandler | undefined);

  if (props.horizontal) return <FlatList {...props} />;

  return (
    <View style={styles.fill}>
      <FlatList {...props} ref={ref} onScroll={handle} scrollEventThrottle={props.scrollEventThrottle ?? 16} />
      <BackToTopButton visible={visible} onPress={() => ref.current?.scrollToOffset({ offset: 0, animated: true })} />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    fill: { flex: 1 },
    wrap: { position: "absolute", right: spacing.md, bottom: spacing.lg },
    button: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.navy,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
  }),
);
