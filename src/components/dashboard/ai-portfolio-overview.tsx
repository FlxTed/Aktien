"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { StockQuote } from "@/types";

export function AIPortfolioOverview({
  stocks = [],
  isLiveData = false,
  openaiConfigured = true,
}: {
  stocks?: StockQuote[];
  isLiveData?: boolean;
  openaiConfigured?: boolean;
}) {
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchSummary = async () => {
    if (safeStocks.length === 0) return;
    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/stock/analyze-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stocks: safeStocks.map((s) => ({
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            changePercent: s.changePercent,
          })),
        }),
      });
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
      else setSummary(
        res.ok
          ? (data.error || "AI overview is unavailable. Try again later.")
          : "Something went wrong. Please try again."
      );
    } catch {
      setSummary("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-primary/25 bg-card/90 shadow-soft backdrop-blur-sm">
      <p className="px-6 pt-4 text-xs text-muted-foreground">
        {isLiveData
          ? "Analysis based on your live market data."
          : "Analysis based on the prices above (demo data - add FINNHUB_API_KEY for live data)."}
      </p>
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Finn AI - portfolio overview
          </span>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </CardHeader>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              {!summary && !loading && (
                <>
                  {!openaiConfigured ? (
                    <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-400">
                      Set <code className="rounded bg-white/10 px-1">OPENAI_API_KEY</code> in Vercel → Settings → Environment Variables and redeploy to use Finn AI.
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={fetchSummary}
                      disabled={safeStocks.length === 0}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {safeStocks.length === 0
                        ? "Add stocks for Finn AI overview"
                        : "Ask Finn AI for overview"}
                    </Button>
                  )}
                </>
              )}
              {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Finn AI is analyzing...</span>
                </div>
              )}
              {summary && !loading && (
                <div className="space-y-2 rounded-xl bg-muted/30 p-3 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">{summary}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    This is not financial advice.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 rounded-lg"
                    onClick={fetchSummary}
                  >
                    Ask Finn AI again
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
