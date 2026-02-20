import { NextResponse } from "next/server";
import { getUserIdForRequest } from "@/lib/auth";
import { loadEnv, getAIPortfolioSummary } from "@/lib/openai-analysis";

export async function POST(req: Request) {
  loadEnv();
  await getUserIdForRequest();

  try {
    const body = await req.json();
    const { stocks } = body as { stocks: { symbol: string; name: string; price: number; changePercent: number }[] };
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json(
        { error: "stocks array required" },
        { status: 400 }
      );
    }

    const summary = await getAIPortfolioSummary(
      stocks.map((s) => ({
        symbol: s.symbol,
        name: s.name ?? s.symbol,
        price: Number(s.price),
        changePercent: Number(s.changePercent ?? 0),
      }))
    );

    return NextResponse.json({ summary });
  } catch (e) {
    console.error("Portfolio analyze error:", e);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
