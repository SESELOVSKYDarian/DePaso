/** Una tarea que se repite sola mientras la API está encendida. */
export interface ScheduledJob {
  name: string;
  /** Cada cuánto se repite. */
  everyMs: number;
  /** Cuánto espera después de arrancar la API para correr la primera vez. */
  firstDelayMs: number;
  run: () => Promise<unknown>;
}

/** Corre una tarea y anota en el log cómo le fue; un error nunca tira abajo la API. */
async function runJob(job: ScheduledJob): Promise<void> {
  try {
    const result = await job.run();
    console.log(`[tareas] ${job.name}: ok`, result ?? "");
  } catch (error) {
    console.error(`[tareas] ${job.name}: falló`, error);
  }
}

/** Programa las tareas: la primera vez tras una espera corta y después cada `everyMs`. */
export function startInternalSchedule(jobs: ScheduledJob[]): void {
  for (const job of jobs) {
    setTimeout(() => {
      void runJob(job);
      setInterval(() => void runJob(job), job.everyMs).unref();
    }, job.firstDelayMs).unref();
  }
}
