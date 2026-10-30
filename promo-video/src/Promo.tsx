import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { Background } from "./components/Background";
import { FeatureScene } from "./scenes/FeatureScene";
import { FEATURES } from "./scenes/features";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { INTRO_FRAMES, OUTRO_FRAMES, SCENE_FRAMES } from "./theme";

export const TOTAL_FRAMES = INTRO_FRAMES + FEATURES.length * SCENE_FRAMES + OUTRO_FRAMES;

// música sin voz: arranca en el segundo 8 de la canción, entra y sale suave
const volumenMusica = (frame: number) =>
  interpolate(frame, [0, 45, TOTAL_FRAMES - 90, TOTAL_FRAMES], [0, 0.85, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const Promo = () => (
  <AbsoluteFill>
    <Background />
    <Audio src={staticFile("audio/cipher.oga")} startFrom={8 * 30} volume={volumenMusica} />
    <Sequence durationInFrames={INTRO_FRAMES}>
      <Intro />
    </Sequence>
    {FEATURES.map((feature, i) => (
      <Sequence key={feature.titulo} from={INTRO_FRAMES + i * SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
        <FeatureScene feature={feature} invertida={i % 2 === 1} />
      </Sequence>
    ))}
    <Sequence from={INTRO_FRAMES + FEATURES.length * SCENE_FRAMES} durationInFrames={OUTRO_FRAMES}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);
