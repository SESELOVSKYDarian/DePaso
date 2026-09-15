import { prisma } from "@depaso/database";
import { LEGAL_DOCUMENT_VERSIONS } from "@depaso/domain";
import { registerRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { createPrismaAuthProvider } from "@/lib/auth/authProvider";
import { setSessionCookie } from "@/lib/auth/cookies";
import { getClientIp } from "@/lib/auth/request";
import { checkRateLimit } from "@/lib/auth/rateLimit";

const authProvider = createPrismaAuthProvider();

// Evita alta masiva de cuentas desde una misma IP — sección 81. Valor MVP, no definido en docs.
const REGISTER_RATE_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  if (!checkRateLimit(`register:${getClientIp(request)}`, REGISTER_RATE_LIMIT.max, REGISTER_RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { email, password, displayName, marketingOptIn } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_ALREADY_REGISTERED" }, { status: 409 });
  }

  const passwordHash = await authProvider.hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName ?? null,
        profile: {
          create: { ageConfirmed18Plus: true, marketingOptIn },
        },
      },
    });

    // Evidencia de aceptación — obligatoria, FUNCTIONAL.md "Requisitos de auditoría y trazabilidad".
    await tx.userConsent.createMany({
      data: [
        {
          userId: created.id,
          type: "TERMS",
          documentVersion: LEGAL_DOCUMENT_VERSIONS.TERMS,
          accepted: true,
        },
        {
          userId: created.id,
          type: "PRIVACY",
          documentVersion: LEGAL_DOCUMENT_VERSIONS.PRIVACY,
          accepted: true,
        },
        {
          userId: created.id,
          // Preferencia, no un documento versionado — no hay "versión" real detrás.
          type: "MARKETING",
          documentVersion: "n/a",
          accepted: marketingOptIn,
        },
      ],
    });

    return created;
  });

  const session = await authProvider.createSession(user.id);

  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        marketingOptIn,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      token: session.token,
      expiresAt: session.expiresAt,
    },
    { status: 201 }
  );
  setSessionCookie(response, session.token);
  return response;
}
