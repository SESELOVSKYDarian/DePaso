import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export interface PreparedImage {
  /** Imagen para la ventana emergente (data URI). */
  imageData: string;
  /** Miniatura para las listas (data URI). */
  thumbData: string;
}

/** Tope de la imagen grande en caracteres: el servidor acepta hasta 700.000. */
const MAX_IMAGE_CHARS = 650_000;
const IMAGE_WIDTH = 960;
const THUMB_WIDTH = 160;

/** Achica y comprime una foto a JPEG y la devuelve como data URI. */
async function shrink(uri: string, sourceWidth: number, width: number, quality: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  // solo se achica: una foto chica no se agranda
  if (sourceWidth > width) context.resize({ width });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  return `data:image/jpeg;base64,${saved.base64}`;
}

/**
 * Deja que la persona elija una imagen (de la galería del celular o, en la web, de sus archivos)
 * y la prepara: una versión grande para la ventana y una miniatura para las listas. Devuelve
 * `null` si cancela. Falla con un mensaje claro si no se dio permiso o la imagen no se pudo achicar.
 */
export async function pickAnnouncementImage(): Promise<PreparedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && permission.canAskAgain === false) {
    throw new Error("No tenemos permiso para ver tus fotos. Activalo desde los ajustes del celular.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [16, 10],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  let imageData = await shrink(asset.uri, asset.width, IMAGE_WIDTH, 0.72);
  // si pesa demasiado, se vuelve a comprimir más fuerte
  if (imageData.length > MAX_IMAGE_CHARS) imageData = await shrink(asset.uri, asset.width, 720, 0.5);
  if (imageData.length > MAX_IMAGE_CHARS) throw new Error("La imagen es muy pesada. Probá con otra más simple.");

  const thumbData = await shrink(asset.uri, asset.width, THUMB_WIDTH, 0.6);
  return { imageData, thumbData };
}
