import { NextResponse } from "next/server";
import { getUserIdForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getUserIdForRequest();
  if (!userId) {
    return NextResponse.json({ alerts: [] });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      type: a.type,
      kind: a.kind ?? "percent",
      percent: a.percent,
      baseline: a.baseline,
      targetPrice: a.targetPrice,
      triggered: a.triggered,
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getUserIdForRequest();
  if (!userId) {
    return NextResponse.json(
      { error: "Database not configured. Add DATABASE_URL in Vercel to save alerts." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { symbol, type, kind, percent, baseline, targetPrice } = body;
  const sym = (symbol as string)?.toUpperCase()?.trim();
  if (!sym || !type) {
    return NextResponse.json({ error: "symbol and type required" }, { status: 400 });
  }
  if (type !== "rise" && type !== "drop") {
    return NextResponse.json({ error: "type must be rise or drop" }, { status: 400 });
  }

  const alertKind = (kind as string) === "absolute" ? "absolute" : "percent";

  if (alertKind === "absolute") {
    const price = Number(targetPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "targetPrice required for absolute alerts" }, { status: 400 });
    }
    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol: sym,
        type: type as string,
        kind: "absolute",
        targetPrice: price,
      },
    });
    return NextResponse.json({
      id: alert.id, symbol: alert.symbol, type: alert.type, kind: alert.kind,
      targetPrice: alert.targetPrice, triggered: false,
    });
  }

  if (percent == null || baseline == null) {
    return NextResponse.json({ error: "percent and baseline required for percent alerts" }, { status: 400 });
  }

  const alert = await prisma.alert.create({
    data: {
      userId,
      symbol: sym,
      type: type as string,
      kind: "percent",
      percent: Number(percent),
      baseline: Number(baseline),
    },
  });

  return NextResponse.json({
    id: alert.id, symbol: alert.symbol, type: alert.type, kind: alert.kind,
    percent: alert.percent, baseline: alert.baseline, triggered: false,
  });
}

// PATCH: mark alert as triggered (called by client after notification fires)
export async function PATCH(req: Request) {
  const userId = await getUserIdForRequest();
  if (!userId) return NextResponse.json({ ok: true });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.alert.updateMany({
    where: { id, userId },
    data: { triggered: true, triggeredAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserIdForRequest();
  if (!userId) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.alert.deleteMany({
    where: { id, userId },
  });

  return NextResponse.json({ ok: true });
}
