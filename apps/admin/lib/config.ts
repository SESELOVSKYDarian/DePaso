/** `NEXT_PUBLIC_*` se inlinea en build time (convención Next.js). Sin un valor configurado,
 * apunta a `apps/api` corriendo en local (`pnpm --filter @depaso/api run dev`). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
