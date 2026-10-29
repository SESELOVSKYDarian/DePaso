import { Image, type ImageProps, type ImageSourcePropType } from "react-native";
import { useTheme } from "@/lib/theme";

interface IllustrationProps extends Omit<ImageProps, "source"> {
  source: ImageSourcePropType;
  /** Versión para modo oscuro: mismos dibujos con los trazos claros (sin panel ni fondo). */
  darkSource?: ImageSourcePropType;
}

/**
 * Ilustración de marca: PNG transparente, sin fondo ni tarjeta detrás. En modo oscuro usa la
 * variante con trazos claros para que se vea sobre el negro.
 */
export function Illustration({ source, darkSource, ...props }: IllustrationProps) {
  const { isDark } = useTheme();
  return <Image {...props} source={isDark && darkSource ? darkSource : source} />;
}
