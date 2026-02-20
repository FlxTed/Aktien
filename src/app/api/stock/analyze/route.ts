import { NextResponse } from "next/server";
import { getUserIdForRequest } from "@/lib/auth";
import { loadEnv, getAIAnalysis } from "@/lib/openai-analysis";

export async function POST(req: Request) {
  loadEnv();
  await getUserIdForRequest();

  try {
    const body = await req.json();
    const { symbol, companyName, currentPrice, changePercent, periodHigh, periodLow } = body;

    if (!symbol || currentPrice == null) {
      return NextResponse.json({ error: "Symbol and currentPrice required" }, { status: 400 });
    }

    const analysis = await getAIAnalysis({
      symbol,
      companyName: companyName ?? symbol,
      currentPrice: Number(currentPrice),
      changePercent: Number(changePercent ?? 0),
      periodHigh: periodHigh != null ? Number(periodHigh) : undefined,
      periodLow: periodLow != null ? Number(periodLow) : undefined,
    });

    return NextResponse.json({ analysis });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
