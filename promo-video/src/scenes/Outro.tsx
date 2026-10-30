import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { OUTRO_FRAMES, colors, fonts } from "../theme";

// cierre: llamado a descargar y crédito de la música (licencia CC BY 3.0)
export const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 90 } });
  const texto = interpolate(frame, [30, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fundido = interpolate(frame, [0, 12, OUTRO_FRAMES - 20, OUTRO_FRAMES], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fundido }}>
      <Img
        src={staticFile("brand/symbol.svg")}
        style={{ width: 230, opacity: entrada, transform: `scale(${interpolate(entrada, [0, 1], [0.7, 1])})` }}
      />
      <div
        style={{
          fontFamily: fonts.title,
          fontWeight: 700,
          fontSize: 120,
          color: colors.text,
          marginTop: 40,
          opacity: texto,
          transform: `translateY(${interpolate(texto, [0, 1], [24, 0])}px)`,
        }}
      >
        Descargá <span style={{ color: colors.blue }}>DePaso</span>
      </div>
      <div style={{ fontFamily: fonts.body, fontSize: 40, color: colors.muted, marginTop: 20, opacity: texto }}>
        Ahorrá en el camino.
      </div>
      <div style={{ position: "absolute", bottom: 46, fontFamily: fonts.body, fontSize: 22, color: "#5d6370" }}>
        Música: «Cipher», Kevin MacLeod (incompetech.com) · Licencia CC BY 3.0 · Precios de ejemplo, ficticios
      </div>
    </AbsoluteFill>
  );
};
