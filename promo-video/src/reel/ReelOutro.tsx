import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

// cierre: el logo se arma, llamado a descargar y crédito de la música (CC BY 3.0)
export const ReelOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 2, fps, config: { damping: 15, stiffness: 100 } });
  const texto = interpolate(frame, [22, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fundido = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fundido }}>
      <Img
        src={staticFile("brand/logo-dark.svg")}
        style={{
          width: 880,
          opacity: logo,
          transform: `scale(${interpolate(logo, [0, 1], [0.85, 1])})`,
          filter: `blur(${interpolate(logo, [0, 1], [10, 0])}px)`,
        }}
      />
      <div
        style={{
          marginTop: 120,
          padding: "34px 70px",
          borderRadius: 999,
          background: colors.blue,
          fontFamily: fonts.title,
          fontWeight: 700,
          fontSize: 76,
          color: "#06101f",
          opacity: texto,
          transform: `translateY(${interpolate(texto, [0, 1], [40, 0])}px)`,
        }}
      >
        Descargá DePaso
      </div>
      <div style={{ position: "absolute", bottom: 70, fontFamily: fonts.body, fontSize: 24, color: "#5d6370", textAlign: "center" }}>
        Música: «Cipher», Kevin MacLeod (incompetech.com) · CC BY 3.0
        <br />
        Precios de ejemplo, ficticios
      </div>
    </AbsoluteFill>
  );
};
