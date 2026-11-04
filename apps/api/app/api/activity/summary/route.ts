import { NextRequest, NextResponse } from "next/server";
import { buildActivitySummary } from "@/lib/activity/roleFeed";
import { getCurrentUser, toAuthUserResponse } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Los numeritos de la app: lo que espera respuesta en Actividad y, para el admin, en cada sección. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = await toAuthUserResponse(current.userId);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json(await buildActivitySummary(current.userId, user.role));
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
