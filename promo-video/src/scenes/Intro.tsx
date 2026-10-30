import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTRO_FRAMES, colors, fonts } from "../theme";

// apertura: el logo aparece y después la pregunta de la marca
export const Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 6, fps, config: { damping: 16, stiffness: 80 } });
  const pregunta = interpolate(frame, [48, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(frame, [INTRO_FRAMES - 14, INTRO_FRAMES], [1, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: salida }}>
      <Img
        src={staticFile("brand/logo-dark.svg")}
        style={{
          width: 900,
          opacity: logo,
          transform: `scale(${interpolate(logo, [0, 1], [0.8, 1])}) translateY(${interpolate(pregunta, [0, 1], [30, -60])}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 640,
          fontFamily: fonts.title,
          fontWeight: 600,
          fontSize: 78,
          color: colors.text,
          opacity: pregunta,
          transform: `translateY(${interpolate(pregunta, [0, 1], [30, 0])}px)`,
          filter: `blur(${interpolate(pregunta, [0, 1], [12, 0])}px)`,
          textAlign: "center",
        }}
      >
        ¿Y si ahorrar te quedara <span style={{ color: colors.blue }}>de paso</span>?
      </div>
    </AbsoluteFill>
  );
};
