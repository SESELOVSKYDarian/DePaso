/**
 * Corre una tarea después de responder. El servidor es un proceso Node que sigue vivo
 * (EasyPanel), así que alcanza con no esperar la promesa; si falla se registra y listo.
 */
export function runInBackground(task: () => Promise<unknown>): void {
  void task().catch((error) => {
    console.error("background task failed", error instanceof Error ? error.name : "unknown");
  });
}
