import { randomBytes } from "node:crypto";
import { Prisma, prisma } from "@depaso/database";
import { LEGAL_DOCUMENT_VERSIONS } from "@depaso/domain";
import { oauthLoginRequestSchema, oauthProviderIdSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { createPrismaAuthProvider } from "@/lib/auth/authProvider";
import { setSessionCookie } from "@/lib/auth/cookies";
import { exchangeCodeForProfile } from "@/lib/auth/oauthProviders";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/request";

const authProvider = createPrismaAuthProvider();

const OAUTH_RATE_LIMIT = { max: 20, windowMs: 15 * 60 * 1000 };

/**
 * `POST /api/auth/oauth/:provider` — login o alta con Google / Meta / Discord.
 *
 * - Cuenta existente (mismo email verificado por el proveedor): inicia sesión.
 * - Cuenta nueva: exige `consent` (18+, términos, privacidad), igual que el registro por
 *   email; sin él responde 409 `ACCOUNT_NOT_FOUND` y la app manda a crear la cuenta.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  if (!checkRateLimit(`oauth:${getClientIp(request)}`, OAUTH_RATE_LIMIT.max, OAUTH_RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const { provider: rawProvider } = await context.params;
  const providerId = oauthProviderIdSchema.safeParse(rawProvider);
  if (!providerId.success) {
    return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = oauthLoginRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { code, redirectUri, codeVerifier, consent } = parsed.data;

  let profile;
  try {
    profile = await exchangeCodeForProfile(providerId.data, { code, redirectUri, codeVerifier });
  } catch (error) {
    console.error(`oauth ${providerId.data} exchange failed`, error);
    return NextResponse.json({ error: "OAUTH_FAILED" }, { status: 502 });
  }
  if (!profile) {
    return NextResponse.json({ error: "PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!profile.email || !profile.emailVerified) {
    // Sin email verificado no se vincula a una cuenta: evita que alguien tome una cuenta ajena.
    return NextResponse.json({ error: "EMAIL_UNAVAILABLE" }, { status: 422 });
  }
  const email = profile.email.trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (user?.deletedAt) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  let created = false;
  if (!user) {
    if (!consent) {
      return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 409 });
    }
    // Contraseña aleatoria que nadie conoce: la cuenta entra por el proveedor o por "Olvidé mi contraseña".
    const passwordHash = await authProvider.hashPassword(randomBytes(32).toString("hex"));
    const marketingOptIn = consent.marketingOptIn;
    user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName: profile.name?.slice(0, 80) ?? null,
          profile: { create: { ageConfirmed18Plus: true, marketingOptIn } },
        },
        include: { profile: true },
      });
      await tx.userConsent.createMany({
        data: [
          { userId: newUser.id, type: "TERMS", documentVersion: LEGAL_DOCUMENT_VERSIONS.TERMS, accepted: true },
          { userId: newUser.id, type: "PRIVACY", documentVersion: LEGAL_DOCUMENT_VERSIONS.PRIVACY, accepted: true },
          { userId: newUser.id, type: "MARKETING", documentVersion: "n/a", accepted: marketingOptIn },
        ],
      });
      return newUser;
    });
    created = true;
  }

  const session = await authProvider.createSession(user.id);
  const response = NextResponse.json(
    {
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
      isNewAccount: created,
    },
    { status: created ? 201 : 200 }
  );
  setSessionCookie(response, session.token);
  return response;
}
