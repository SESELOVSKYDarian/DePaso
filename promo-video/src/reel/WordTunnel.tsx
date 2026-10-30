import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";

// las funciones vuelan hacia la cámara y se resuelven en el lema
const PALABRAS = ["Top 3", "Promos", "Mapa", "IA", "Listas", "Precios reales"];
// cada palabra pasa por un carril distinto para no pisarse
const CARRILES = [-560, 420, -260, 600, -720, 260];

export const WordTunnel = () => {
  const frame = useCurrentFrame();
  const lema = interpolate(frame, [58, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(frame, [80, 90], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: salida, perspective: 900 }}>
      {PALABRAS.map((palabra, i) => {
        const t = frame - i * 9;
        const z = interpolate(t, [0, 26], [-2400, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const opacidad = interpolate(t, [0, 6, 20, 26], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <div
            key={palabra}
            style={{
              position: "absolute",
              fontFamily: fonts.title,
              fontWeight: 700,
              fontSize: 104,
              whiteSpace: "nowrap",
              color: i % 2 === 0 ? colors.text : colors.blue,
              opacity: opacidad,
              transform: `translate(${i % 2 === 0 ? -120 : 120}px, ${CARRILES[i]}px) translateZ(${z}px)`,
            }}
          >
            {palabra}
          </div>
        );
      })}
      <div
        style={{
          fontFamily: fonts.title,
          fontWeight: 700,
          fontSize: 150,
          color: colors.text,
          textAlign: "center",
          lineHeight: 1.02,
          opacity: lema,
          transform: `scale(${interpolate(lema, [0, 1], [0.7, 1])})`,
          filter: `blur(${interpolate(lema, [0, 1], [14, 0])}px)`,
        }}
      >
        Todo,
        <br />
        <span style={{ color: colors.lime }}>de paso.</span>
      </div>
    </AbsoluteFill>
  );
};
