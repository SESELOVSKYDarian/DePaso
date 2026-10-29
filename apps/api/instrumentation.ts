/**
 * Se ejecuta una vez cuando arranca el servidor de Next. Deja andando las tareas de
 * mantenimiento (fotos, promos, popularidad) sin necesidad de cron jobs en el hosting.
 * Se apaga con `INTERNAL_CRON=off` y no corre en desarrollo.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production" || process.env.INTERNAL_CRON === "off") return;

  // una sola vez por proceso, aunque Next llame a register() de nuevo
  const flags = globalThis as { __depasoTasksStarted?: boolean };
  if (flags.__depasoTasksStarted) return;
  flags.__depasoTasksStarted = true;

  const { startInternalSchedule } = await import("./lib/cron/internalSchedule");
  const { MAINTENANCE_JOBS } = await import("./lib/cron/jobs");
  startInternalSchedule(MAINTENANCE_JOBS);
}
