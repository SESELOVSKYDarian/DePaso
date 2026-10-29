import { Platform } from "react-native";

const STYLE_ID = "depaso-web-styles";

/**
 * Retoques que solo existen en el navegador: barras de desplazamiento finas y discretas (la del
 * sistema es gruesa y blanca y desentona con el modo oscuro) y sin rebote al llegar al borde.
 * En el celular no hace nada.
 */
export function installWebStyles(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html, body { overscroll-behavior: none; }
    * { scrollbar-width: thin; scrollbar-color: rgba(128,128,128,0.45) transparent; }
    *::-webkit-scrollbar { width: 6px; height: 6px; }
    *::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.45); border-radius: 3px; }
    *::-webkit-scrollbar-track { background: transparent; }
  `;
  document.head.appendChild(style);
}
