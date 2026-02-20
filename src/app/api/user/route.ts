import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : null;
  if (name === null || name.length === 0) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.slice(0, 200) },
    });
    return NextResponse.json({ ok: true, name });
  } catch (e) {
    console.error("PATCH /api/user error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
