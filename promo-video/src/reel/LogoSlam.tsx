import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

// del blanco de la escena realista a negro: el logo golpea y deja un anillo de luz
export const LogoSlam = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blanco = interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp" });
  const golpe = spring({ frame: frame - 4, fps, config: { damping: 11, stiffness: 160 } });
  const anillo = interpolate(frame, [8, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(frame, [60, 75], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: salida }}>
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          border: `6px solid ${colors.blue}`,
          opacity: 1 - anillo,
          transform: `scale(${0.3 + anillo * 1.6})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          border: `3px solid ${colors.lime}`,
          opacity: (1 - anillo) * 0.8,
          transform: `scale(${0.2 + anillo * 2.2})`,
        }}
      />
      <Img
        src={staticFile("brand/symbol.svg")}
        style={{ width: 360, transform: `scale(${interpolate(golpe, [0, 1], [2.6, 1])})`, opacity: golpe }}
      />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: blanco }} />
    </AbsoluteFill>
  );
};
