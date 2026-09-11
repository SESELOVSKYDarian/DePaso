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

  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });

  // Mismo error genérico exista o no el email / falle o no la contraseña — sección 81, no
  // dar pistas de qué emails están registrados.
  const invalidCredentials = () => NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

  if (!user || user.deletedAt) return invalidCredentials();

  const passwordOk = await authProvider.verifyPassword(password, user.passwordHash);
  if (!passwordOk) return invalidCredentials();

  const session = await authProvider.createSession(user.id);

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      marketingOptIn: user.profile?.marketingOptIn ?? false,
      createdAt: user.createdAt.toISOString(),
    },
    token: session.token,
    expiresAt: session.expiresAt,
  });
  setSessionCookie(response, session.token);
  return response;
}
