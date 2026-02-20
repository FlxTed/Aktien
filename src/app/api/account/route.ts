import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** DELETE /api/account — delete the current user and all their data. */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/account error:", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
