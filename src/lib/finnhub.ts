const FINNHUB_BASE = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY;

// --- In-memory cache ---
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_QUOTE = 10_000;  // 10s - tight for near-real-time
const CACHE_TTL_CANDLE = 60_000; // 1m
const CACHE_TTL_PROFILE = 86_400_000; // 24h

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data as T;
}
function setCache(key: string, data: unknown, ttl: number) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

// --- Retry wrapper ---
async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 429 && i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error("Fetch failed after retries");
}

// --- Market hours ---
export function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960; // 9:30 AM - 4:00 PM ET
}

// --- Types ---
export interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
  t: number;
}

export interface FinnhubCandle {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  s: string;
  t: number[];
  v: number[];
}

export interface FinnhubProfile {
  name: string;
  ticker: string;
  exchange: string;
  finnhubIndustry?: string;
  weburl?: string;
}

// --- Demo data (no API key) ---
const DEMO_QUOTES: Record<string, FinnhubQuote> = {
  AAPL: { c: 228.5, d: 2.1, dp: 0.93, h: 229, l: 225, o: 226, pc: 226.4, t: 0 },
  TSLA: { c: 248.2, d: -3.5, dp: -1.39, h: 252, l: 246, o: 251, pc: 251.7, t: 0 },
  NVDA: { c: 135.8, d: 4.2, dp: 3.19, h: 136, l: 131, o: 132, pc: 131.6, t: 0 },
  GOOGL: { c: 175.3, d: 1.2, dp: 0.69, h: 176, l: 173, o: 174, pc: 174.1, t: 0 },
  MSFT: { c: 415.5, d: 2.8, dp: 0.68, h: 416, l: 412, o: 413, pc: 412.7, t: 0 },
  AMZN: { c: 198.2, d: -1.1, dp: -0.55, h: 200, l: 197, o: 199, pc: 199.3, t: 0 },
};
const DEMO_PROFILES: Record<string, FinnhubProfile> = {
  AAPL: { name: "Apple Inc", ticker: "AAPL", exchange: "NASDAQ" },
  TSLA: { name: "Tesla Inc", ticker: "TSLA", exchange: "NASDAQ" },
  NVDA: { name: "NVIDIA Corporation", ticker: "NVDA", exchange: "NASDAQ" },
  GOOGL: { name: "Alphabet Inc", ticker: "GOOGL", exchange: "NASDAQ" },
  MSFT: { name: "Microsoft Corporation", ticker: "MSFT", exchange: "NASDAQ" },
  AMZN: { name: "Amazon.com Inc", ticker: "AMZN", exchange: "NASDAQ" },
};

function makePlaceholderQuote(): FinnhubQuote {
  return { c: 100, d: 0, dp: 0, h: 100, l: 100, o: 100, pc: 100, t: 0 };
}

// --- Data validation ---
function isValidQuote(q: FinnhubQuote): boolean {
  return (
    typeof q.c === "number" && isFinite(q.c) && q.c > 0 &&
    typeof q.pc === "number" && isFinite(q.pc) && q.pc > 0
  );
}

/** Recalculate change fields from price and previousClose for accuracy */
export function computeChange(price: number, previousClose: number) {
  if (!previousClose || previousClose === 0) return { change: 0, changePercent: 0 };
  const change = price - previousClose;
  const changePercent = (change / previousClose) * 100;
  return {
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
  };
}

// --- Public API ---

export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  const upper = symbol.toUpperCase();
  const key = `quote:${upper}`;
  const cached = getCached<FinnhubQuote>(key);
  if (cached) return cached;

  if (!API_KEY) {
    const demo = DEMO_QUOTES[upper] ?? makePlaceholderQuote();
    setCache(key, demo, CACHE_TTL_QUOTE);
    return demo;
  }

  try {
    const res = await fetchWithRetry(
      `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(upper)}&token=${API_KEY}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FinnhubQuote;
    if (!isValidQuote(data)) return null;
    // Recalculate change for accuracy
    const { change, changePercent } = computeChange(data.c, data.pc);
    const validated: FinnhubQuote = { ...data, d: change, dp: changePercent };
    setCache(key, validated, CACHE_TTL_QUOTE);
    return validated;
  } catch (err) {
    console.error(`getQuote(${upper}) error:`, err);
    return null;
  }
}

export async function getCandles(
  symbol: string,
  resolution: "1" | "D" = "D",
  from?: number,
  to?: number
): Promise<FinnhubCandle | null> {
  const upper = symbol.toUpperCase();
  const now = Math.floor(Date.now() / 1000);
  const toSec = to ?? now;
  const fromSec = from ?? toSec - 365 * 86400;
  const key = `candle:${upper}:${resolution}:${fromSec}:${toSec}`;
  const cached = getCached<FinnhubCandle>(key);
  if (cached) return cached;

  if (!API_KEY) {
    const base = DEMO_QUOTES[upper]?.c ?? 100;
    const days = Math.max(2, Math.min(365, Math.floor((toSec - fromSec) / 86400) || 30));
    const c = Array.from({ length: days }, () => base + (Math.random() - 0.5) * 10);
    const data: FinnhubCandle = {
      c, h: c.map((x) => x + 1), l: c.map((x) => x - 1), o: c,
      s: "ok", t: c.map((_, i) => fromSec + i * 86400), v: c.map(() => 1e6),
    };
    setCache(key, data, CACHE_TTL_CANDLE);
    return data;
  }

  try {
    const res = await fetchWithRetry(
      `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(upper)}&resolution=${resolution}&from=${fromSec}&to=${toSec}&token=${API_KEY}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FinnhubCandle;
    if (!data.t?.length) return null;
    setCache(key, data, CACHE_TTL_CANDLE);
    return data;
  } catch (err) {
    console.error(`getCandles(${upper}) error:`, err);
    return null;
  }
}

export async function getProfile(symbol: string): Promise<FinnhubProfile | null> {
  const upper = symbol.toUpperCase();
  const key = `profile:${upper}`;
  const cached = getCached<FinnhubProfile>(key);
  if (cached) return cached;

  if (!API_KEY) {
    const demo = DEMO_PROFILES[upper] ?? { name: upper, ticker: upper, exchange: "-" };
    setCache(key, demo, CACHE_TTL_PROFILE);
    return demo;
  }

  try {
    const res = await fetchWithRetry(
      `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(upper)}&token=${API_KEY}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FinnhubProfile;
    setCache(key, data, CACHE_TTL_PROFILE);
    return data;
  } catch (err) {
    console.error(`getProfile(${upper}) error:`, err);
    return null;
  }
}
