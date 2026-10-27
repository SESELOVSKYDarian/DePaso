import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, toAuthUserResponse } from "@/lib/auth/currentUser";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await toAuthUserResponse(current.userId);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  return NextResponse.json(user);
}
