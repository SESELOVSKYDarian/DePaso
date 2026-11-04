import { NextRequest, NextResponse } from "next/server";
import { buildPersonalFeed } from "@/lib/activity/personalFeed";
import { buildRoleItems } from "@/lib/activity/roleFeed";
import { getCurrentUser, toAuthUserResponse } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Avisos personales de Actividad > Para vos: listas compartidas, bajas de precio y ofertas cerca. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const user = await toAuthUserResponse(current.userId);
    const [roleItems, personal] = await Promise.all([buildRoleItems(current.userId, user?.role ?? "USER"), buildPersonalFeed(current.userId)]);
    // primero lo que hay que resolver, después lo demás
    return NextResponse.json({ items: [...roleItems, ...personal] });
  } catch (error) {
    console.error("Falló el feed personal:", error);
    return NextResponse.json({ error: "FEED_FAILED" }, { status: 502 });
  }
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
