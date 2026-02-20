import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const databaseConfigured = url.startsWith("postgresql://") || url.startsWith("postgres://");
  const openaiConfigured = !!process.env.OPENAI_API_KEY?.trim();
  return NextResponse.json({
    realTimePrices: !!process.env.FINNHUB_API_KEY?.trim(),
    databaseConfigured,
    openaiConfigured,
  });
}
