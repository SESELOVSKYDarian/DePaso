import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  screen: string; // nombre del archivo en public/screens
  delay?: number; // cuadros de espera antes de entrar
  fromX?: number; // desde dónde desliza al entrar
  height?: number;
  tilt?: number; // inclinación en grados
};

// celular con la captura real adentro; entra con resorte y flota apenas
export const Phone = ({ screen, delay = 0, fromX = 120, height = 860, tilt = 0 }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 90 } });
  const x = interpolate(entrada, [0, 1], [fromX, 0]);
  const flota = Math.sin((frame - delay) / 28) * 8;
  const ancho = (height * 860) / 1864;

  return (
    <div
      style={{
        width: ancho,
        height,
        borderRadius: 54,
        border: "10px solid #1b1e25",
        boxShadow: "0 40px 90px rgba(0,0,0,0.65), 0 0 0 2px #2c313c",
        overflow: "hidden",
        opacity: entrada,
        transform: `translate(${x}px, ${flota}px) rotate(${tilt}deg) scale(${interpolate(entrada, [0, 1], [0.92, 1])})`,
        background: "#000",
      }}
    >
      <Img src={staticFile(`screens/${screen}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};
