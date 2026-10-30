import { Linking, Platform } from "react-native";
import { WEB_BASE_URL } from "@/lib/config";

const MANUAL_PATH = "/manual/DePaso-Manual-de-usuario.pdf";

/**
 * Descarga el manual en PDF. En la web baja directo del mismo sitio; en el celular lo abre
 * el navegador desde la web pública (que lo sirve como descarga).
 */
export async function downloadManual(): Promise<void> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const link = document.createElement("a");
    link.href = MANUAL_PATH;
    link.download = "DePaso-Manual-de-usuario.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  await Linking.openURL(`${WEB_BASE_URL}${MANUAL_PATH}`);
}
