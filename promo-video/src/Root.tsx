import "./fonts";
import { Composition } from "remotion";
import { Promo, TOTAL_FRAMES } from "./Promo";
import { Reel } from "./reel/Reel";
import { REEL_FRAMES, REEL_H, REEL_W } from "./reel/timing";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const Root = () => (
  <>
    <Composition id="DePasoPromo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="DePasoReel" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={REEL_W} height={REEL_H} />
  </>
);
