import { AbsoluteFill, Sequence, Video, staticFile } from "remotion";
import { Background } from "../components/Background";
import { KineticPhrase } from "./KineticPhrase";
import { LogoSlam } from "./LogoSlam";
import { MapRoute } from "./MapRoute";
import { Phone3D } from "./Phone3D";
import { ReelOutro } from "./ReelOutro";
import { SavingsHits } from "./SavingsHits";
import { ESCENAS } from "./timing";
import { WordTunnel } from "./WordTunnel";

const ESCENA = (nombre: keyof typeof ESCENAS) => ({
  from: ESCENAS[nombre].desde,
  durationInFrames: ESCENAS[nombre].dura,
});

// reel publicitario: primero la escena realista (hecha en HyperFrames), después DePaso
export const Reel = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence {...ESCENA("realista")}>
      {/* Video (no OffthreadVideo): el render en Windows no llega al servidor local por IPv6 */}
      <Video src={staticFile("realista.mp4")} muted />
    </Sequence>
    <Sequence from={ESCENAS.logo.desde}>
      <Background />
    </Sequence>
    <Sequence {...ESCENA("logo")}>
      <LogoSlam />
    </Sequence>
    <Sequence {...ESCENA("frase")}>
      <KineticPhrase />
    </Sequence>
    <Sequence {...ESCENA("celular")}>
      <Phone3D />
    </Sequence>
    <Sequence {...ESCENA("mapa")}>
      <MapRoute />
    </Sequence>
    <Sequence {...ESCENA("ahorro")}>
      <SavingsHits />
    </Sequence>
    <Sequence {...ESCENA("tunel")}>
      <WordTunnel />
    </Sequence>
    <Sequence {...ESCENA("cierre")}>
      <ReelOutro />
    </Sequence>
  </AbsoluteFill>
);
