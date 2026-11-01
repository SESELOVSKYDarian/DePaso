/** Primer valor no vacío entre varias variables de entorno (sirve para aceptar nombres alternativos). */
export function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Claves de la voz y de la IA: el nombre oficial primero y el del proveedor como respaldo. */
export const sttApiKey = () => firstEnv("STT_API_KEY", "GROQ_API_KEY");
export const llmApiKey = () => firstEnv("LLM_API_KEY", "ENIGMA_API_KEY");
