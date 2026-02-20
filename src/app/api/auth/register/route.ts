import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, password: hashed, name: name || null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Register error:", e);
    const message =
      e && typeof e === "object" && "code" in e
        ? (e as { code: string }).code === "P2021"
          ? "Database not set up. Run: npx prisma db push"
          : (e as { message?: string }).message ?? "Registration failed"
        : "Registration failed. Check DATABASE_URL in .env and run: npx prisma db push.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
