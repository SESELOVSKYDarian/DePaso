import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

// tres flashes con recortes distintos de la app y después el número que importa
const FLASHES = [
  { pantalla: "best-prices.png", y: 0.2, desde: 0 },
  { pantalla: "payments.png", y: 0.45, desde: 12 },
  { pantalla: "purchase.png", y: 0.3, desde: 24 },
];

export const SavingsHits = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numero = spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 120 } });
  const monto = Math.round(interpolate(frame, [40, 66], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const salida = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp" });
  const flash = [...FLASHES].reverse().find((f) => frame >= f.desde && frame < 36);

  return (
    <AbsoluteFill style={{ opacity: salida }}>
      {flash ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={staticFile(`screens/${flash.pantalla}`)}
            style={{
              width: 1080,
              position: "absolute",
              top: -flash.y * 2340,
              transform: `scale(${interpolate(frame - flash.desde, [0, 12], [1.25, 1.1])})`,
              filter: "contrast(1.08)",
            }}
          />
        </AbsoluteFill>
      ) : null}

      {frame >= 36 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: colors.muted, opacity: numero }}>
            EN TU MISMA VUELTA
          </div>
          <div
            style={{
              fontFamily: fonts.title,
              fontWeight: 700,
              fontSize: 230,
              color: colors.lime,
              transform: `scale(${interpolate(numero, [0, 1], [1.6, 1])})`,
              opacity: numero,
              textShadow: "0 0 80px rgba(184,255,60,.45)",
            }}
          >
            ${monto}
          </div>
          <div style={{ fontFamily: fonts.title, fontWeight: 600, fontSize: 80, color: colors.text, opacity: numero }}>ahorrados.</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
