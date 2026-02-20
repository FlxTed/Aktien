"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ExternalLink, Radio } from "lucide-react";

const FINNHUB_URL = "https://finnhub.io/register";

export function DataSourceBanner() {
  const [realTime, setRealTime] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setRealTime(d?.realTimePrices === true))
      .catch(() => setRealTime(false));
  }, []);

  if (realTime === null) return null; // avoid layout flash

  if (realTime) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm text-green-400">
        <Radio className="h-4 w-4 shrink-0" />
        <span>Finnhub live data - refreshing every 15s (free tier may have up to 15 min delay)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>Demo data - prices are samples, not live.</span>
      <a
        href={FINNHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100"
      >
        Get free API key <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
