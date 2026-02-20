import { NextResponse } from "next/server";
import { getCandles } from "@/lib/finnhub";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const period = searchParams.get("period") ?? "7d";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  let from = now;
  if (period === "7d") from = now - 7 * 24 * 60 * 60;
  else if (period === "30d") from = now - 30 * 24 * 60 * 60;
  else if (period === "90d") from = now - 90 * 24 * 60 * 60;
  else if (period === "1y") from = now - 365 * 24 * 60 * 60;

  const candle = await getCandles(symbol, "D", from, now);
  if (!candle || !candle.t?.length) {
    return NextResponse.json({ labels: [], values: [] });
  }

  const labels = candle.t.map((t) =>
    new Date(t * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const values = candle.c;

  return NextResponse.json({ labels, values });
}
