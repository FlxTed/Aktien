"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StockQuote } from "@/types";
import { useCurrency } from "@/lib/currency";
import { AnimatedCounter } from "./animated-counter";
import { StockChart } from "./stock-chart";
import Link from "next/link";
import { Sparkles, Loader2, AlertCircle, Bell } from "lucide-react";

const CHART_PERIODS = ["7d", "30d", "90d", "1y"] as const;
type ChartPeriod = (typeof CHART_PERIODS)[number];

interface StockDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: StockQuote | null;
  chartLabels: string[];
  chartData: number[];
  openaiConfigured?: boolean;
}

export function StockDetailModal({
  open,
  onOpenChange,
  stock,
  chartLabels: initialLabels,
  chartData: initialData,
  openaiConfigured = true,
}: StockDetailModalProps) {
  const { formatPrice } = useCurrency();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");
  const [chartLabels, setChartLabels] = useState<string[]>(initialLabels);
  const [chartData, setChartData] = useState<number[]>(initialData);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!open || !stock) return;
    setChartLabels(initialLabels);
    setChartData(initialData);
    setChartPeriod("30d");
  }, [open, stock?.symbol, initialLabels, initialData]);

  useEffect(() => {
    if (!open || !stock) return;
    setChartLoading(true);
    fetch(`/api/stocks/candles?symbol=${encodeURIComponent(stock.symbol)}&period=${chartPeriod}`)
      .then((r) => r.json())
      .then((d) => {
        setChartLabels(Array.isArray(d?.labels) ? d.labels : []);
        setChartData(Array.isArray(d?.values) ? d.values : []);
      })
      .catch(() => { setChartLabels([]); setChartData([]); })
      .finally(() => setChartLoading(false));
  }, [open, stock?.symbol, chartPeriod]);

  const fetchAnalysis = useCallback(async () => {
    if (!stock) return;
    setAiLoading(true);
    setAiText(null);
    try {
      const res = await fetch("/api/stock/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: stock.symbol,
          companyName: stock.name,
          currentPrice: stock.price,
          changePercent: stock.changePercent,
          periodHigh: stock.high,
          periodLow: stock.low,
        }),
      });
      const data = await res.json();
      if (data.analysis) setAiText(data.analysis);
      else setAiText("Could not load analysis. Please try again.");
    } catch {
      setAiText("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }, [stock]);

  if (!stock) return null;

  const isPositive = stock.changePercent >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{stock.symbol}</span>
            <span className="text-muted-foreground font-normal">- {stock.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {formatPrice(stock.price)}
              </p>
              <AnimatedCounter
                value={stock.changePercent}
                format="percent"
                isPositive={isPositive}
                className="text-sm font-medium"
              />
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>High {formatPrice(stock.high)}</p>
              <p>Low {formatPrice(stock.low)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Price history</span>
              <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
                {CHART_PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChartPeriod(p)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      chartPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "7d" ? "1W" : p === "30d" ? "1M" : p === "90d" ? "3M" : "1Y"}
                  </button>
                ))}
              </div>
            </div>
            {chartLoading ? (
              <div className="flex h-[280px] items-center justify-center rounded-xl border border-border bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartLabels.length > 0 && chartData.length > 0 ? (
              <div className="rounded-xl border border-border bg-muted/30 p-2">
                <StockChart
                  labels={chartLabels}
                  data={chartData}
                  positive={isPositive}
                  height={280}
                />
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-muted-foreground">
                No chart data
              </div>
            )}
          </div>

          <Link
            href="/alerts"
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Bell className="h-4 w-4" />
            Set price alert for {stock.symbol}
          </Link>

          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <button
              type="button"
              onClick={() => setAiExpanded((e) => !e)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Finn AI analysis
              </span>
              <span className="text-muted-foreground text-sm">
                {aiExpanded ? "Collapse" : "Expand"}
              </span>
            </button>
            <AnimatePresence>
              {aiExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {!aiText && !aiLoading && (
                      <>
                        {!openaiConfigured ? (
                          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-400">
                            Set <code className="rounded bg-white/10 px-1">OPENAI_API_KEY</code> in Vercel → Settings → Environment Variables and redeploy to use Finn AI.
                          </p>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchAnalysis}
                            className="w-full"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Ask Finn AI
                          </Button>
                        )}
                      </>
                    )}
                    {aiLoading && (
                      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Finn AI is analyzing...</span>
                      </div>
                    )}
                    {aiText && !aiLoading && (
                      <div className="space-y-2 rounded-xl bg-background/60 p-3 text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap">{aiText}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5" />
                          This is not financial advice.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
