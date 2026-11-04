import { useVideoPlayer, VideoView } from "expo-video";
import type { StyleProp, ViewStyle } from "react-native";

/** Video de una publicidad: con controles, sin sonido al empezar y sin reproducirse solo. */
export function AdVideo({ url, style }: { url: string; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.muted = true;
    instance.loop = false;
  });
  return <VideoView player={player} style={style} nativeControls contentFit="cover" />;
}
