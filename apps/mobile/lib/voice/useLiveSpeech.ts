import { useCallback, useEffect, useRef, useState } from "react";

/** Tope de una dictada: alcanza para una lista larga. */
const MAX_LISTEN_MS = 60_000;
/** Cuántas veces se vuelve a empezar solo si el teléfono corta el reconocimiento por silencio. */
const MAX_AUTO_RESTARTS = 6;

export type LiveStart = "started" | "denied" | "error";

/** Lo mínimo que se usa del módulo de reconocimiento (así el código no depende de su tipado). */
interface SpeechModule {
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  addListener: (event: string, listener: (payload: never) => void) => { remove: () => void };
}

/**
 * El módulo es nativo: no existe en Expo Go ni en versiones viejas de la app. Se carga adentro de
 * un try/catch para que, si falta, la app siga andando con la grabación de siempre.
 */
function loadModule(): SpeechModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require("expo-speech-recognition") as { ExpoSpeechRecognitionModule?: SpeechModule };
    const module = loaded.ExpoSpeechRecognitionModule ?? null;
    return module && module.isRecognitionAvailable() ? module : null;
  } catch {
    return null;
  }
}

/** Convierte el volumen del reconocedor (-2…10) en un nivel 0…1 para dibujar las ondas. */
export function speechVolumeToLevel(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, (value + 2) / 12));
}

/** Une lo ya confirmado con lo que se está diciendo ahora, sin dobles espacios. */
export function joinSpeech(committed: string, interim: string): string {
  return `${committed} ${interim}`.replace(/\s+/g, " ").trim();
}

/**
 * Dictado en vivo: mientras la persona habla, `transcript` va mostrando lo que entiende el
 * teléfono. Al terminar llama a `onFinish` con el texto completo. Si el reconocimiento se corta
 * solo por una pausa, vuelve a empezar para no perder lo que sigue.
 */
export function useLiveSpeech(onFinish: (text: string) => void) {
  const speech = useRef<SpeechModule | null | undefined>(undefined);
  if (speech.current === undefined) speech.current = loadModule();
  const available = speech.current !== null;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const committed = useRef("");
  const interim = useRef("");
  const userStopped = useRef(false);
  const restarts = useRef(0);
  const startedAt = useRef(0);
  const finish = useRef(onFinish);
  finish.current = onFinish;

  const begin = useCallback(() => {
    speech.current?.start({ lang: "es-AR", interimResults: true, continuous: true, addsPunctuation: false, volumeChangeEventOptions: { enabled: true, intervalMillis: 120 } });
  }, []);

  // los eventos del reconocedor
  useEffect(() => {
    const module = speech.current;
    if (!module) return;
    const subscriptions = [
      module.addListener("result", ((event: { isFinal: boolean; results: { transcript: string }[] }) => {
        const text = event.results[0]?.transcript ?? "";
        if (event.isFinal) {
          committed.current = joinSpeech(committed.current, text);
          interim.current = "";
        } else {
          interim.current = text;
        }
        setTranscript(joinSpeech(committed.current, interim.current));
      }) as never),
      module.addListener("volumechange", ((event: { value: number }) => setLevel(speechVolumeToLevel(event.value))) as never),
      module.addListener("end", (() => {
        const elapsed = Date.now() - startedAt.current;
        // el teléfono cortó por silencio pero la persona sigue: se vuelve a empezar
        if (!userStopped.current && restarts.current < MAX_AUTO_RESTARTS && elapsed < MAX_LISTEN_MS) {
          restarts.current += 1;
          committed.current = joinSpeech(committed.current, interim.current);
          interim.current = "";
          begin();
          return;
        }
        setIsListening(false);
        setLevel(0);
        finish.current(joinSpeech(committed.current, interim.current));
      }) as never),
      module.addListener("error", ((event: { error: string }) => {
        // "no-speech" y "aborted" no son fallas: es silencio o el corte que pidió la persona
        if (event.error === "no-speech" || event.error === "aborted") return;
        userStopped.current = true;
      }) as never),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [begin]);

  // el reloj de la dictada y el corte a los 60 segundos
  useEffect(() => {
    if (!isListening) return;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setDurationMs(elapsed);
      if (elapsed >= MAX_LISTEN_MS) {
        userStopped.current = true;
        speech.current?.stop();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [isListening]);

  const start = useCallback(async (): Promise<LiveStart> => {
    const module = speech.current;
    if (!module) return "error";
    try {
      const permission = await module.requestPermissionsAsync();
      if (!permission.granted) return "denied";
      committed.current = "";
      interim.current = "";
      userStopped.current = false;
      restarts.current = 0;
      startedAt.current = Date.now();
      setTranscript("");
      setDurationMs(0);
      setIsListening(true);
      begin();
      return "started";
    } catch {
      return "error";
    }
  }, [begin]);

  const stop = useCallback(() => {
    userStopped.current = true;
    speech.current?.stop();
  }, []);

  // al salir de la pantalla se corta el micrófono
  useEffect(() => () => speech.current?.abort(), []);

  return { available, transcript, isListening, level, durationMs, start, stop };
}