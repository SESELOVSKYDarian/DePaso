import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

type Props = {
  etiqueta: string; // texto chico arriba, en lima
  titulo: string; // frase grande; cada palabra entra en su momento
  detalle: string; // texto de apoyo
};

// titular estilo presentación: palabra por palabra, con desenfoque que se aclara
export const Headline = ({ etiqueta, titulo, detalle }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = titulo.split(" ");

  const etiquetaOpacidad = interpolate(frame, [4, 18], [0, 1], { extrapolateRight: "clamp" });
  const detalleOpacidad = interpolate(frame, [30 + palabras.length * 4, 48 + palabras.length * 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: 820 }}>
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 6,
          color: colors.lime,
          textTransform: "uppercase",
          opacity: etiquetaOpacidad,
          marginBottom: 26,
        }}
      >
        {etiqueta}
      </div>
      <div style={{ fontFamily: fonts.title, fontWeight: 700, fontSize: 112, lineHeight: 1.04, color: colors.text }}>
        {palabras.map((palabra, i) => {
          const p = spring({ frame: frame - 10 - i * 4, fps, config: { damping: 20, stiffness: 120 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: 24,
                opacity: p,
                transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
                filter: `blur(${interpolate(p, [0, 1], [14, 0])}px)`,
              }}
            >
              {palabra}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 38,
          lineHeight: 1.45,
          color: colors.muted,
          marginTop: 36,
          opacity: detalleOpacidad,
          transform: `translateY(${interpolate(detalleOpacidad, [0, 1], [18, 0])}px)`,
        }}
      >
        {detalle}
      </div>
    </div>
  );
};
