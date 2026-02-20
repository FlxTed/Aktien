import { NextResponse } from "next/server";
import { getUserIdForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuote, getProfile, computeChange, isMarketOpen } from "@/lib/finnhub";
import type { StockQuote } from "@/types";

export async function GET() {
  try {
    const userId = await getUserIdForRequest();
    if (!userId) {
      return NextResponse.json({
        stocks: [],
        quotes: [],
        marketOpen: isMarketOpen(),
        timestamp: Date.now(),
      });
    }

    let userStocks = await prisma.userStock.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Seed default stocks for new users
    if (userStocks.length === 0) {
      const defaults = ["AAPL", "TSLA", "NVDA"];
      await Promise.all(
        defaults.map((symbol) =>
          prisma.userStock.create({ data: { userId, symbol } }).catch(() => {})
        )
      );
      userStocks = await prisma.userStock.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    // Fetch all quotes + profiles in parallel
    const results = await Promise.all(
      userStocks.map(async (us) => {
        const [quote, profile] = await Promise.all([
          getQuote(us.symbol),
          getProfile(us.symbol),
        ]);
        if (!quote || typeof quote.c !== "number" || quote.c <= 0) return null;

        const { change, changePercent } = computeChange(quote.c, quote.pc);

        return {
          symbol: us.symbol,
          name: profile?.name ?? us.symbol,
          price: Math.round(quote.c * 100) / 100,
          change,
          changePercent,
          high: quote.h,
          low: quote.l,
          open: quote.o,
          previousClose: quote.pc,
          updatedAt: Date.now(),
          shares: us.shares ?? 1,
          buyPrice: us.buyPrice ?? null,
          sector: profile?.finnhubIndustry ?? null,
        } as StockQuote;
      })
    );

    const quotes = results.filter((q): q is StockQuote => q != null);

    return NextResponse.json({
      stocks: userStocks.map((s) => ({ symbol: s.symbol, id: s.id })),
      quotes,
      marketOpen: isMarketOpen(),
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("GET /api/stocks error:", e);
    return NextResponse.json(
      { error: "Failed to load portfolio", quotes: [], stocks: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdForRequest();
  if (!userId) {
    return NextResponse.json(
      { error: "Database not configured. Add DATABASE_URL in Vercel to save stocks." },
      { status: 503 }
    );
  }

  let body: { symbol?: string; shares?: number; buyPrice?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sym = (body.symbol as string)?.toUpperCase()?.trim();
  if (!sym || sym.length > 10 || !/^[A-Z.]+$/.test(sym)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const quote = await getQuote(sym);
  if (!quote) {
    return NextResponse.json({ error: "Symbol not found" }, { status: 400 });
  }

  const shares = typeof body.shares === "number" && body.shares > 0 ? body.shares : 1;
  const buyPrice = typeof body.buyPrice === "number" && body.buyPrice > 0 ? body.buyPrice : null;

  try {
    await prisma.userStock.upsert({
      where: { userId_symbol: { userId, symbol: sym } },
      create: { userId, symbol: sym, shares, buyPrice },
      update: { shares, buyPrice },
    });
  } catch (e) {
    console.error("POST /api/stocks DB error:", e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, symbol: sym });
}

export async function PATCH(req: Request) {
  const userId = await getUserIdForRequest();
  if (!userId) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  let body: { symbol?: string; shares?: number; buyPrice?: number | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const symbol = (body.symbol as string)?.toUpperCase()?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const update: { shares?: number; buyPrice?: number | null } = {};
  if (typeof body.shares === "number" && body.shares > 0) update.shares = body.shares;
  if (body.buyPrice !== undefined) update.buyPrice = body.buyPrice === null || (typeof body.buyPrice === "number" && body.buyPrice > 0) ? body.buyPrice : null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.userStock.updateMany({
    where: { userId, symbol },
    data: update,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserIdForRequest();
  if (!userId) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase()?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  await prisma.userStock.deleteMany({
    where: { userId, symbol },
  });

  return NextResponse.json({ ok: true });
}
