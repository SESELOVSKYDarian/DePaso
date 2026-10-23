import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef } from "react";

/** Tope de una grabación: alcanza para una lista larga y mantiene el archivo chico. */
export const MAX_RECORDING_MS = 60_000;

/** Cada cuánto se lee el estado (tiempo y volumen). Corto para que las ondas se vean fluidas. */
const POLL_MS = 90;

/** Rango de volumen que se muestra: por debajo de -52 dB es silencio; en 0 dB satura. */
const QUIET_DB = -52;

export type StartResult = "started" | "denied" | "error";

/** Convierte el volumen del micrófono (dB, -160…0) en un nivel 0…1 para dibujar. */
export function meteringToLevel(db: number | undefined): number {
  if (db === undefined || !Number.isFinite(db)) return 0;
  const linear = Math.min(1, Math.max(0, (db - QUIET_DB) / -QUIET_DB));
  // La voz normal queda en el medio del rango; la curva suave evita barras siempre chicas.
  return Math.pow(linear, 0.8);
}

/**
 * Grabación de voz para el asistente de compras (m4a). `start` pide el permiso del micrófono
 * si hace falta; `stop` devuelve la ruta del archivo. Corta sola a los 60 segundos.
 * `level` (0…1) es el volumen actual, para dibujar las ondas mientras se habla.
 */
export function useVoiceRecorder(onAutoStop?: (uri: string | null) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, POLL_MS);
  const autoStopped = useRef(false);

  const start = useCallback(async (): Promise<StartResult> => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return "denied";
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
      autoStopped.current = false;
      recorder.record();
      return "started";
    } catch {
      return "error";
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    try {
      await recorder.stop();
    } catch {
      // Si ya estaba detenida, igual puede haber un archivo para usar.
    }
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    return recorder.uri ?? null;
  }, [recorder]);

  useEffect(() => {
    if (state.isRecording && state.durationMillis >= MAX_RECORDING_MS && !autoStopped.current) {
      autoStopped.current = true;
      void stop().then((uri) => onAutoStop?.(uri));
    }
  }, [state.isRecording, state.durationMillis, stop, onAutoStop]);

  return {
    start,
    stop,
    isRecording: state.isRecording,
    durationMs: state.durationMillis,
    level: state.isRecording ? meteringToLevel(state.metering) : 0,
  };
}
