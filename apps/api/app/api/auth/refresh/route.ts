import { refreshRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { refreshSession } from "@/lib/auth/session";
import { toAuthUserResponse } from "@/lib/auth/currentUser";

/** POST /api/auth/refresh — canjea un refresh token por access + refresh nuevos (rotación). */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = refreshRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const session = await refreshSession(parsed.data.refreshToken);
  if (!session) return NextResponse.json({ error: "INVALID_REFRESH_TOKEN" }, { status: 401 });

  const user = await toAuthUserResponse(session.userId);
  if (!user) return NextResponse.json({ error: "INVALID_REFRESH_TOKEN" }, { status: 401 });

  const response = NextResponse.json({
    user,
    token: session.token,
    expiresAt: session.expiresAt,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
  });
  setSessionCookie(response, session.token);
  return response;
}
