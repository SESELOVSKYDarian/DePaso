import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

const LINEAS = [
  { texto: "Tu compra", color: colors.text, en: 0 },
  { texto: "te queda", color: colors.text, en: 14 },
  { texto: "de paso.", color: colors.blue, en: 28 },
];

// frase de marca línea por línea; la última pega más fuerte y después todo se achica
export const KineticPhrase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const achica = interpolate(frame, [80, 120], [1, 0.82], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(frame, [104, 120], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", opacity: salida, transform: `scale(${achica})` }}>
      {LINEAS.map((linea, i) => {
        const p = spring({ frame: frame - linea.en, fps, config: { damping: 14, stiffness: 140 } });
        const ultima = i === LINEAS.length - 1;
        return (
          <div
            key={linea.texto}
            style={{
              fontFamily: fonts.title,
              fontWeight: 700,
              fontSize: ultima ? 210 : 160,
              lineHeight: 1.02,
              color: linea.color,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-120, 0])}px) scale(${interpolate(p, [0, 1], [ultima ? 1.4 : 1.1, 1])})`,
              filter: `blur(${interpolate(p, [0, 1], [18, 0])}px)`,
              textShadow: ultima ? `0 0 60px rgba(124,176,255,${0.5 * p})` : "none",
            }}
          >
            {linea.texto}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
