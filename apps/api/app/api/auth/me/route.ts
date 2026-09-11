import { prisma } from "@depaso/database";
import { updateProfileRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, toAuthUserResponse } from "@/lib/auth/currentUser";

export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await toAuthUserResponse(current.userId);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = updateProfileRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { displayName, marketingOptIn } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (displayName !== undefined) {
      await tx.user.update({ where: { id: current.userId }, data: { displayName } });
    }
    if (marketingOptIn !== undefined) {
      await tx.userProfile.update({ where: { userId: current.userId }, data: { marketingOptIn } });
      await tx.userConsent.create({
        data: {
          userId: current.userId,
          type: "MARKETING",
          documentVersion: "n/a",
          accepted: marketingOptIn,
        },
      });
    }
  });

  const user = await toAuthUserResponse(current.userId);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json(user);
}
