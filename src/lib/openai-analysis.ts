import OpenAI from "openai";
import path from "path";
import { readFileSync } from "fs";
import type { AIAnalysis } from "@/types";

export function loadEnv() {
  if (process.env.OPENAI_API_KEY?.trim()) return;
  const cwd = process.cwd();
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(path.join(cwd, file), "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^OPENAI_API_KEY\s*=\s*(.+)$/i);
        if (match) {
          const val = match[1].trim().replace(/^["']|["']$/g, "").trim();
          if (val) { process.env.OPENAI_API_KEY = val; return; }
        }
      }
    } catch { /* skip */ }
  }
}

function getOpenAI() {
  loadEnv();
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/** Message shown when OpenAI is not configured (env or .env). */
export const OPENAI_NOT_CONFIGURED_MSG =
  "AI analysis needs an API key. Set OPENAI_API_KEY in Vercel → Settings → Environment Variables (or in .env locally) and redeploy.";

// --- Single stock structured analysis ---
const STRUCTURED_PROMPT = `You are a neutral financial data analyst. Never give buy/sell advice.

Given a stock's data, respond ONLY with valid JSON (no markdown, no code fences) in this exact shape:
{
  "summary": "1-2 sentence neutral summary of current price action",
  "trend": "1 sentence on the recent trend direction and strength",
  "risks": "1 sentence on key risks or headwinds",
  "outlook": "1 sentence neutral forward-looking statement"
}

Rules:
- Be factual and professional
- No recommendations
- No phrases like "you should" or "we recommend"
- Each field must be a single string, 1-2 sentences max`;

export interface StockContext {
  symbol: string;
  companyName: string;
  currentPrice: number;
  changePercent: number;
  periodHigh?: number;
  periodLow?: number;
}

export async function getAIAnalysis(context: StockContext): Promise<string> {
  const openai = getOpenAI();
  if (!openai) return OPENAI_NOT_CONFIGURED_MSG;

  const msg = [
    `${context.symbol} (${context.companyName})`,
    `Price: $${context.currentPrice.toFixed(2)}`,
    `Change: ${context.changePercent >= 0 ? "+" : ""}${context.changePercent.toFixed(2)}%`,
    context.periodHigh != null ? `High: $${context.periodHigh.toFixed(2)}` : "",
    context.periodLow != null ? `Low: $${context.periodLow.toFixed(2)}` : "",
  ].filter(Boolean).join(" | ");

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STRUCTURED_PROMPT },
        { role: "user", content: msg },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";

    // Try to parse as structured JSON
    try {
      const parsed = JSON.parse(raw) as AIAnalysis;
      if (parsed.summary && parsed.trend && parsed.risks && parsed.outlook) {
        return [
          parsed.summary,
          `Trend: ${parsed.trend}`,
          `Risks: ${parsed.risks}`,
          `Outlook: ${parsed.outlook}`,
          "",
          "This is not financial advice.",
        ].join("\n\n");
      }
    } catch { /* fallback to raw text */ }

    if (!raw.includes("not financial advice")) {
      return raw + "\n\nThis is not financial advice.";
    }
    return raw;
  } catch (err) {
    const msg2 = err instanceof Error ? err.message : String(err);
    if (msg2.includes("api_key") || msg2.includes("invalid") || msg2.includes("Incorrect"))
      return "Invalid API key. Check OPENAI_API_KEY in your environment variables.";
    throw err;
  }
}

// --- Portfolio summary ---
const PORTFOLIO_PROMPT = `You are a neutral financial summarizer. No buy/sell advice.

Given a stock list with prices and daily changes, write 3-4 factual sentences:
1. Overall portfolio direction today
2. Notable movers
3. End with "This is not financial advice."

Be concise and professional.`;

export interface PortfolioStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export async function getAIPortfolioSummary(stocks: PortfolioStock[]): Promise<string> {
  const openai = getOpenAI();
  if (!openai) return OPENAI_NOT_CONFIGURED_MSG;

  const list = stocks
    .map((s) => `${s.symbol} (${s.name}): $${s.price.toFixed(2)}, ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`)
    .join("\n");

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PORTFOLIO_PROMPT },
        { role: "user", content: `Portfolio:\n${list}` },
      ],
      max_tokens: 250,
      temperature: 0.3,
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    if (!text) return "Could not generate overview.";
    if (!text.includes("not financial advice"))
      return text + "\n\nThis is not financial advice.";
    return text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("api_key") || msg.includes("invalid") || msg.includes("Incorrect"))
      return "Invalid API key. Check OPENAI_API_KEY in your environment variables.";
    throw err;
  }
}
