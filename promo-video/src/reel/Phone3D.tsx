import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

// cada pantalla con su frase; se cambian sobre el mismo celular que gira en 3D
const PASOS = [
  { pantalla: "home.png", frase: "Tu lista y tu recorrido, en un toque.", desde: 0 },
  { pantalla: "voice.png", frase: "Armá la lista hablando.", desde: 50 },
  { pantalla: "plans.png", frase: "Tres formas de comprar.", desde: 100 },
];

export const Phone3D = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const giro = interpolate(frame, [0, 150], [-24, 14]);
  const inclinacion = interpolate(frame, [0, 150], [12, -6]);
  const salida = interpolate(frame, [136, 150], [1, 0], { extrapolateLeft: "clamp" });
  const actual = [...PASOS].reverse().find((p) => frame >= p.desde) ?? PASOS[0];

  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: salida }}>
      <div style={{ position: "absolute", top: 1560, left: 80, right: 80, textAlign: "center" }}>
        {PASOS.map((p) => {
          const visible = interpolate(frame, [p.desde, p.desde + 8, p.desde + 44, p.desde + 50], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={p.frase}
              style={{
                position: "absolute",
                width: "100%",
                fontFamily: fonts.title,
                fontWeight: 700,
                fontSize: 84,
                lineHeight: 1.08,
                color: colors.text,
                opacity: visible,
                transform: `translateY(${interpolate(visible, [0, 1], [30, 0])}px)`,
              }}
            >
              {p.frase}
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 150, perspective: 1600 }}>
        <div
          style={{
            width: 620,
            height: 1344,
            borderRadius: 78,
            border: "14px solid #1b1e25",
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 80px 160px rgba(0,0,0,.7), 0 0 120px rgba(124,176,255,.25)",
            transform: `translateY(${interpolate(entrada, [0, 1], [900, 0])}px) rotateY(${giro}deg) rotateX(${inclinacion}deg)`,
          }}
        >
          <Img src={staticFile(`screens/${actual.pantalla}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {/* brillo del vidrio que barre la pantalla */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,.16) 50%, transparent 65%)",
              transform: `translateX(${interpolate(frame % 50, [0, 50], [-700, 700])}px)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
