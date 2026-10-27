import { NextResponse } from "next/server";
import { listProviders } from "@/lib/auth/oauthProviders";
import { postAsQuery } from "@/lib/http/postAdapter";

/** `GET /api/auth/providers` — qué logins sociales están activados en este servidor. */
async function handle() {
  return NextResponse.json({ providers: listProviders() });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
