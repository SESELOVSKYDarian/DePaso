import { optimizeShoppingList } from "@depaso/optimization";
import { optimizeRequestSchema } from "@depaso/validation";
import { NextResponse } from "next/server";

/**
 * Endpoint de prueba end-to-end del motor de optimización (sin DB todavía — los
 * candidatos de comercio/precio se pasan en el body). Sirve para validar que
 * `@depaso/optimization` funciona real desde una capa HTTP, no sólo en tests unitarios.
 * Fase 15+ conectará esto a `@depaso/database` en vez de recibir `storeCandidates` crudos.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = optimizeRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const plans = await optimizeShoppingList(parsed.data);
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: "OPTIMIZATION_FAILED", message: error instanceof Error ? error.message : "unknown" },
      { status: 422 }
    );
  }
}
