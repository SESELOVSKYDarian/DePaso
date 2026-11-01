/**
 * Se ejecuta una vez cuando arranca el servidor de Next. Deja andando las tareas de
 * mantenimiento (fotos, promos, popularidad) sin necesidad de cron jobs en el hosting.
 * Se apaga con `INTERNAL_CRON=off` y no corre en desarrollo.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  // los mails de ADMIN_EMAILS que ya tienen cuenta confirmada pasan a ser administradores
  try {
    const { promoteConfiguredAdmins } = await import("./lib/auth/adminEmails");
    const promoted = await promoteConfiguredAdmins();
    if (promoted > 0) console.log(`admin: ${promoted} cuenta(s) promovida(s) por ADMIN_EMAILS`);
  } catch (error) {
    console.error("admin: no se pudo aplicar ADMIN_EMAILS", error);
  }

  // deja listas las tiras de Inicio para que la primera visita no espere el cálculo
  try {
    const { warmHomeProducts } = await import("./lib/home/homeProducts");
    void warmHomeProducts().catch((error) => console.error("home: no se pudo calentar", error));
  } catch (error) {
    console.error("home: no se pudo calentar", error);
  }

  if (process.env.INTERNAL_CRON === "off") return;

  // una sola vez por proceso, aunque Next llame a register() de nuevo
  const flags = globalThis as { __depasoTasksStarted?: boolean };
  if (flags.__depasoTasksStarted) return;
  flags.__depasoTasksStarted = true;

  const { startInternalSchedule } = await import("./lib/cron/internalSchedule");
  const { MAINTENANCE_JOBS } = await import("./lib/cron/jobs");
  startInternalSchedule(MAINTENANCE_JOBS);
}
