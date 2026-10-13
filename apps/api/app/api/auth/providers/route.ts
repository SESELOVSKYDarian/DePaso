import { NextResponse } from "next/server";
import { listProviders } from "@/lib/auth/oauthProviders";

/** `GET /api/auth/providers` — qué logins sociales están activados en este servidor. */
export async function GET() {
  return NextResponse.json({ providers: listProviders() });
}
