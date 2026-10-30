import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Sonido } from "../components/Sonido";
import { Headline } from "../components/Headline";
import { Phone } from "../components/Phone";
import { SCENE_FRAMES } from "../theme";

export type Feature = {
  etiqueta: string;
  titulo: string;
  detalle: string;
  pantallas: string[]; // una o dos capturas
};

// una función de la app: texto de un lado, celular(es) del otro; alterna el lado en cada escena
export const FeatureScene = ({ feature, invertida }: { feature: Feature; invertida: boolean }) => {
  const frame = useCurrentFrame();
  // fundido de entrada y salida para que las escenas se enlacen
  const opacidad = interpolate(frame, [0, 12, SCENE_FRAMES - 14, SCENE_FRAMES], [0, 1, 1, 0]);
  const doble = feature.pantallas.length > 1;

  return (
    <AbsoluteFill
      style={{
        opacity: opacidad,
        flexDirection: invertida ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 110,
        padding: "0 130px",
      }}
    >
      <Sonido src={staticFile("audio/whoosh.mp3")} volume={0.35} />
      <Headline etiqueta={feature.etiqueta} titulo={feature.titulo} detalle={feature.detalle} />
      <div style={{ display: "flex", gap: doble ? 34 : 0, alignItems: "center" }}>
        {feature.pantallas.map((pantalla, i) => (
          <Phone
            key={pantalla}
            screen={pantalla}
            delay={14 + i * 10}
            height={doble ? 760 : 900}
            fromX={invertida ? -140 : 140}
            tilt={doble ? (i === 0 ? -3 : 3) : 0}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
