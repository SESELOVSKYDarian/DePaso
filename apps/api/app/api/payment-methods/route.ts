import { Prisma, prisma } from "@depaso/database";
import { paymentMethodsInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

/** Medios de pago que el usuario declaró tener (billeteras y tarjetas). */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rows = await prisma.userPaymentMethod.findMany({ where: { userId: current.userId } });
  return NextResponse.json({ methods: rows.map((row: (typeof rows)[number]) => row.methodSlug) });
}

/** Reemplaza el conjunto completo de medios de pago del usuario. */
export async function PUT(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = paymentMethodsInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const methods = [...new Set(parsed.data.methods)];

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userPaymentMethod.deleteMany({ where: { userId: current.userId } });
    if (methods.length > 0) {
      await tx.userPaymentMethod.createMany({
        data: methods.map((methodSlug) => ({ userId: current.userId, methodSlug })),
      });
    }
  });

  return NextResponse.json({ methods });
}
