import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getTokenFromRequest } from "@/lib/auth/request";

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (token) {
    await revokeSession(token);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
