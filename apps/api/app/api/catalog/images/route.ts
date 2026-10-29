import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prefillProductImages } from "@/lib/catalog/productImages";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Productos que se revisan por corrida: poco, porque las bases de fotos piden uso moderado. */
const BATCH_SIZE = 40;

/** Completa las fotos del catálogo por tandas. Lo llama el cron (con `CRON_SECRET`) o un admin. */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const isCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!isCron && !(await requireAdmin(request))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    return NextResponse.json(await prefillProductImages(BATCH_SIZE));
  } catch (error) {
    console.error("Falló la carga de fotos del catálogo:", error);
    return NextResponse.json({ error: "IMAGES_FAILED" }, { status: 502 });
  }
}

export const POST = handle;
