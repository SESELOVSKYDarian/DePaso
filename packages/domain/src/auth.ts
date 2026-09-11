/**
 * Interfaz de autenticación. Implementación de referencia (apps/api): hash de password +
 * sesión propia sobre Prisma/Postgres — ver docs/development/DECISIONS.md. Se aísla detrás
 * de esta interfaz para poder swapear a un proveedor externo (ej. Supabase Auth) sin tocar
 * el resto del backend ni del dominio.
 */

export interface AuthSession {
  userId: string;
  /** Token de sesión en texto plano. Sólo existe en memoria/tránsito — nunca se persiste
   * así (la implementación de referencia guarda un hash, no el token). */
  token: string;
  expiresAt: string;
}

export interface AuthProvider {
  hashPassword(plain: string): Promise<string>;
  verifyPassword(plain: string, hash: string): Promise<boolean>;
  createSession(userId: string): Promise<AuthSession>;
  verifySession(token: string): Promise<AuthSession | null>;
  revokeSession(token: string): Promise<void>;
}
