import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors } from "../theme";

// fondo negro con dos luces suaves (azul y lima) que se mueven despacio
export const Background = () => {
  const frame = useCurrentFrame();
  const t = frame / 90;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          left: 1000 + Math.sin(t) * 80,
          top: -400 + Math.cos(t * 0.8) * 60,
          background: "radial-gradient(circle, rgba(124,176,255,0.26), transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          left: -300 + Math.cos(t * 0.9) * 70,
          top: 600 + Math.sin(t * 0.7) * 60,
          background: "radial-gradient(circle, rgba(184,255,60,0.13), transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );
};
