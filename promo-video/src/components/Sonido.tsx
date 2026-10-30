import { Audio, getRemotionEnvironment } from "remotion";
import type { ComponentProps } from "react";

// Suena solo en el Studio (vista previa). Al renderizar, el audio se mezcla aparte con
// `npm run render:audio` (ver mux-audio.mjs); acá el render sale mudo.
export const Sonido = (props: ComponentProps<typeof Audio>) => {
  if (getRemotionEnvironment().isRendering) return null;
  return <Audio {...props} />;
};
