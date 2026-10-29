import { Image, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "@/lib/theme";

type LogoVariant = "mark" | "wordmark" | "stacked";

const SOURCES = {
  mark: {
    light: require("../../assets/images/logo-mark.png"),
    dark: require("../../assets/images/logo-mark-dark.png"),
  },
  wordmark: {
    light: require("../../assets/images/logo-wordmark.png"),
    dark: require("../../assets/images/logo-wordmark-dark.png"),
  },
  stacked: {
    light: require("../../assets/images/logo-stacked.png"),
    dark: require("../../assets/images/logo-stacked-dark.png"),
  },
} as const;

interface BrandLogoProps {
  /** `mark`: isotipo · `wordmark`: isotipo + DePaso + tagline en horizontal · `stacked`: vertical. */
  variant: LogoVariant;
  style?: StyleProp<ImageStyle>;
}

/**
 * Logo de DePaso en la variante que corresponde al tema: en oscuro el cuerpo del isotipo y
 * el texto se invierten (claro sobre fondo oscuro), el resto de la marca se mantiene.
 */
export function BrandLogo({ variant, style }: BrandLogoProps) {
  const { isDark } = useTheme();
  return (
    <Image
      source={SOURCES[variant][isDark ? "dark" : "light"]}
      style={style}
      resizeMode="contain"
      accessibilityLabel="DePaso"
      accessibilityRole="image"
    />
  );
}
