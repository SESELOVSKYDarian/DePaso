import { Blur, Canvas, ColorMatrix, Group, Paint, RoundedRect, Shadow } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { interpolateColor, useDerivedValue } from "react-native-reanimated";
import {
  DROP_TINT_END,
  DROP_TINT_START,
  GOO_BLUR,
  GOO_GAIN,
  GOO_INSET_RATIO,
  GOO_THRESHOLD,
  ISLAND_FADE_SPAN,
  PALETTE,
  SHADOW_BLUR,
  SHADOW_DY,
} from "@/lib/notifications/constants";
import { buildGeometry, buildGooMatrix, withAlpha } from "@/lib/notifications/geometry";
import { useColors } from "@/lib/theme";
import { useDynamicNotifications } from "./context";

/**
 * Dibujo en Skia: la "isla" negra, el cuello que la une con la gota y la gota que se abre en
 * tarjeta. Las formas se desenfocan y se les aplica una matriz de alfa para que se fundan
 * entre sí (efecto gooey). Sólo se dibuja mientras hay una notificación activa, y la isla
 * aparece con la caída: en teléfonos sin recorte real en pantalla no queda una píldora fija.
 */
export const Gooey = memo(function Gooey() {
  const { layout, drop, expand, tint, simple } = useDynamicNotifications();
  // La gota termina en el color de la tarjeta del tema (blanca en claro, índigo oscuro en oscuro).
  const cardColor = useColors().surface.elevated;

  const matrix = useMemo(() => buildGooMatrix(GOO_GAIN, GOO_THRESHOLD), []);
  const inset = GOO_BLUR * GOO_INSET_RATIO;
  const islandX = layout.centerX - layout.islandWidth / 2;

  const geometry = useDerivedValue(() => buildGeometry(drop.get(), expand.get(), layout));
  const x = useDerivedValue(() => geometry.get().x);
  const y = useDerivedValue(() => geometry.get().y);
  const width = useDerivedValue(() => geometry.get().width);
  const height = useDerivedValue(() => geometry.get().height);
  const radius = useDerivedValue(() => geometry.get().radius);
  const neckX = useDerivedValue(() => geometry.get().neckX);
  const neckY = useDerivedValue(() => geometry.get().neckY);
  const neckWidth = useDerivedValue(() => geometry.get().neckWidth);
  const neckHeight = useDerivedValue(() => geometry.get().neckHeight);
  const neckRadius = useDerivedValue(() => geometry.get().neckRadius);
  const shadowOpacity = useDerivedValue(() => geometry.get().shadowOpacity);

  const island = useDerivedValue(() =>
    interpolateColor(drop.get(), [0, ISLAND_FADE_SPAN], [withAlpha(PALETTE.island, 0), PALETTE.island]),
  );
  const droplet = useDerivedValue(() =>
    interpolateColor(tint.get(), [DROP_TINT_START, DROP_TINT_END], [PALETTE.island, cardColor]),
  );

  if (simple) return null;

  return (
    <Canvas pointerEvents="none" style={[styles.canvas, { height: layout.canvasHeight }]}>
      <Group opacity={shadowOpacity}>
        <RoundedRect x={x} y={y} width={width} height={height} r={radius}>
          <Shadow dx={0} dy={SHADOW_DY} blur={SHADOW_BLUR} color={PALETTE.shadow} shadowOnly />
        </RoundedRect>
      </Group>

      <Group
        layer={
          <Paint>
            <Blur blur={GOO_BLUR} />
            <ColorMatrix matrix={matrix} />
          </Paint>
        }
      >
        <RoundedRect
          x={islandX + inset}
          y={layout.islandTop + inset}
          width={layout.islandWidth - inset * 2}
          height={layout.islandHeight - inset * 2}
          r={Math.max(layout.islandRadius - inset, 0)}
          color={island}
        />
        <RoundedRect x={neckX} y={neckY} width={neckWidth} height={neckHeight} r={neckRadius} color={island} />
        <RoundedRect x={x} y={y} width={width} height={height} r={radius} color={droplet} />
      </Group>

      <RoundedRect
        x={islandX}
        y={layout.islandTop}
        width={layout.islandWidth}
        height={layout.islandHeight}
        r={layout.islandRadius}
        color={island}
      />
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
