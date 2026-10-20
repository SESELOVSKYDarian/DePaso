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

export type StartResult = "started" | "denied" | "error";

/**
 * Grabación de voz para el asistente de compras (m4a). `start` pide el permiso del micrófono
 * si hace falta; `stop` devuelve la ruta del archivo. Corta sola a los 60 segundos.
 */
export function useVoiceRecorder(onAutoStop?: (uri: string | null) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const autoStopped = useRef(false);

  const start = useCallback(async (): Promise<StartResult> => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return "denied";
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
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

  return { start, stop, isRecording: state.isRecording, durationMs: state.durationMillis };
}
