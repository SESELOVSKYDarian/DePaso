/**
 * `EXPO_PUBLIC_*` se inlinea en build time (convención Expo, sin dependencia extra). Sin
 * un valor real configurado, apunta a `localhost:3000` — sirve para iOS Simulator, no para
 * Android Emulator (usar `10.0.2.2`) ni un dispositivo físico (usar la IP LAN de la
 * máquina). Configurar `EXPO_PUBLIC_API_URL` en `.env` según el entorno de prueba.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/** Web pública de DePaso: de ahí baja el manual en PDF cuando la app corre en el celular. */
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://estanga-depaso-web.evo4vr.easypanel.host";
