import { prisma } from "@depaso/database";
import { loginRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { createPrismaAuthProvider } from "@/lib/auth/authProvider";
import { setSessionCookie } from "@/lib/auth/cookies";
import { getClientIp } from "@/lib/auth/request";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const authProvider = createPrismaAuthProvider();

// Sección 81: rate limit contra fuerza bruta. Valor MVP, no definido en docs.
const LOGIN_RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };
const LOGIN_EMAIL_LIMIT = { max: 8, windowMs: 15 * 60 * 1000 };
/** Hash con el mismo formato que los reales, para gastar el mismo tiempo cuando el email no existe. */
const DUMMY_HASH = `${"00".repeat(16)}:${"00".repeat(64)}`;

export async function POST(request: NextRequest) {
  if (!checkRateLimit(`login:${getClientIp(request)}`, LOGIN_RATE_LIMIT.max, LOGIN_RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // También se limita por email: cambiar de IP no sirve para probar claves de una misma cuenta.
  if (!checkRateLimit(`login-email:${email}`, LOGIN_EMAIL_LIMIT.max, LOGIN_EMAIL_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });

  // Mismo error genérico exista o no el email / falle o no la contraseña — sección 81, no
  // dar pistas de qué emails están registrados.
  const invalidCredentials = () => NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

  // Si el email no existe igual se calcula un hash: así la respuesta tarda lo mismo y no se
  // puede averiguar qué mails están registrados midiendo el tiempo.
  const passwordOk = await authProvider.verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || user.deletedAt || !passwordOk) return invalidCredentials();

  const session = await authProvider.createSession(user.id);

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      marketingOptIn: user.profile?.marketingOptIn ?? false,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    token: session.token,
    expiresAt: session.expiresAt,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
  });
  setSessionCookie(response, session.token);
  return response;
}
