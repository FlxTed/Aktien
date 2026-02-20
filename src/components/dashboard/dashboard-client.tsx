"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, RefreshCw, Search, ArrowUpDown, Keyboard } from "lucide-react";
import { StockCard } from "@/components/stock/stock-card";
import { StockCardSkeleton } from "@/components/stock/stock-card-skeleton";
import { StockDetailModal } from "@/components/stock/stock-detail-modal";
import { AddStockForm } from "@/components/dashboard/add-stock-form";
import { AIPortfolioOverview } from "@/components/dashboard/ai-portfolio-overview";
import { DataSourceBanner } from "@/components/dashboard/data-source-banner";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  requestNotificationPermission,
  getNotificationPermission,
  checkAlertsClientSide,
} from "@/lib/notifications";
import { getRelativeTimeString, getTimeGreeting } from "@/lib/relative-time";
import { Confetti } from "@/components/confetti";
import { InstallAppButton } from "@/components/install-app-button";
import type { StockQuote } from "@/types";

function RelativeTime({ date }: { date: Date | null }) {
  const ts = date?.getTime();
  const [text, setText] = useState(() => (date ? getRelativeTimeString(date) : ""));
  useEffect(() => {
    if (ts == null) return;
    const d = new Date(ts);
    setText(getRelativeTimeString(d));
    const id = setInterval(() => setText(getRelativeTimeString(d)), 60_000);
    return () => clearInterval(id);
  }, [ts]);
  if (!date) return null;
  return <span>{text}</span>;
}

type SortOption = "name" | "price-desc" | "price-asc" | "change-desc" | "change-asc";

const POLL_OPEN = 15_000;   // 15s when market open
const POLL_CLOSED = 60_000; // 60s when closed
const FETCH_TIMEOUT = 12_000;

export function DashboardClient() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [chartDataBySymbol, setChartDataBySymbol] = useState<Record<string, number[]>>({});
  const [firstLoad, setFirstLoad] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modalStock, setModalStock] = useState<StockQuote | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [alerts, setAlerts] = useState<{ id: string; symbol: string; type: string; percent: number; baseline: number; triggered: boolean }[]>([]);
  const [databaseConfigured, setDatabaseConfigured] = useState(true);
  const [openaiConfigured, setOpenaiConfigured] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("change-desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setIsLiveData(d?.realTimePrices === true);
        setDatabaseConfigured(d?.databaseConfigured !== false);
        setOpenaiConfigured(d?.openaiConfigured !== false);
      })
      .catch(() => setIsLiveData(false));
    setNotifPermission(getNotificationPermission());
  }, []);

  // Fetch alerts for client-side checking
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.alerts)) setAlerts(data.alerts);
    } catch { /* ignore */ }
  }, []);

  const fetchStocks = useCallback(async () => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const res = await fetch("/api/stocks", { signal: controller.signal });
      clearTimeout(tid);
      const data = await res.json().catch(() => ({}));
      const list: StockQuote[] = res.ok && Array.isArray(data.quotes) ? data.quotes : [];

      // Track previous prices for flash animation
      setPrevPrices((prev) => {
        const next: Record<string, number> = { ...prev };
        list.forEach((q) => { if (prev[q.symbol] !== undefined) next[q.symbol] = prev[q.symbol]; });
        return next;
      });
      // After setting prevPrices, update quotes (so cards can compare)
      setQuotes(list);
      // Now update prevPrices to current for next cycle
      setTimeout(() => {
        setPrevPrices(() => {
          const next: Record<string, number> = {};
          list.forEach((q) => { next[q.symbol] = q.price; });
          return next;
        });
      }, 1500); // flash lasts 1.5s

      setMarketOpen(!!data.marketOpen);
      setLastUpdated(new Date());

      // Client-side alert check -> Windows notifications
      if (list.length > 0 && alerts.length > 0) {
        const triggered = checkAlertsClientSide(list, alerts);
        if (triggered.length > 0) {
          // Mark triggered alerts on server
          for (const id of triggered) {
            fetch(`/api/alerts?id=${id}`, { method: "PATCH" }).catch(() => {});
          }
          // Refresh alerts list
          fetchAlerts();
        }
      }

      // Load candle data in background (parallel, non-blocking)
      if (list.length > 0) {
        Promise.all(
          list.map(async (q) => {
            try {
              const cr = await fetch(`/api/stocks/candles?symbol=${encodeURIComponent(q.symbol)}&period=7d`);
              const cd = await cr.json().catch(() => ({}));
              return { symbol: q.symbol, values: Array.isArray(cd?.values) ? cd.values : [] };
            } catch { return { symbol: q.symbol, values: [] as number[] }; }
          })
        ).then((results) => {
          const next: Record<string, number[]> = {};
          results.forEach(({ symbol, values }) => { next[symbol] = values; });
          setChartDataBySymbol((prev) => ({ ...prev, ...next }));
        });
      }
    } catch {
      // timeout or network error
    } finally {
      clearTimeout(tid);
      setFirstLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alerts/fetchAlerts read at call time
  }, []);

  // Adaptive polling: faster when market is open
  useEffect(() => {
    fetchStocks();
    fetchAlerts();
    const ms = marketOpen ? POLL_OPEN : POLL_CLOSED;
    intervalRef.current = setInterval(fetchStocks, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStocks, fetchAlerts, marketOpen]);

  const openDetail = useCallback(async (stock: StockQuote) => {
    setModalStock(stock);
    setModalOpen(true);
    try {
      const res = await fetch(`/api/stocks/candles?symbol=${encodeURIComponent(stock.symbol)}&period=30d`);
      const data = await res.json().catch(() => ({}));
      setChartLabels(Array.isArray(data?.labels) ? data.labels : []);
      setChartData(Array.isArray(data?.values) ? data.values : []);
    } catch { setChartLabels([]); setChartData([]); }
  }, []);

  const onStockAdded = useCallback(() => { fetchStocks(); }, [fetchStocks]);

  const { toast } = useToast();
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchStocks();
    setIsRefreshing(false);
    toast({ title: "Portfolio updated", variant: "success" });
  }, [fetchStocks, toast]);

  const filteredAndSortedQuotes = useMemo(() => {
    let list = [...quotes];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (x) =>
          x.symbol.toLowerCase().includes(q) ||
          (x.name && x.name.toLowerCase().includes(q))
      );
    }
    if (sortBy === "name") list.sort((a, b) => (a.symbol || "").localeCompare(b.symbol || ""));
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "change-desc") list.sort((a, b) => b.changePercent - a.changePercent);
    else if (sortBy === "change-asc") list.sort((a, b) => a.changePercent - b.changePercent);
    return list;
  }, [quotes, searchQuery, sortBy]);

  const hasQuotes = Array.isArray(quotes) && quotes.length > 0;
  const sortLabel =
    sortBy === "name" ? "Name" : sortBy === "price-desc" ? "Price (high)" : sortBy === "price-asc" ? "Price (low)" : sortBy === "change-desc" ? "Change % (best)" : "Change % (worst)";

  // Keyboard shortcut: R to refresh (when not typing in an input)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.closest("input, textarea, [contenteditable]")) return;
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRefresh]);

  const portfolioUpPercent = useMemo(() => {
    if (!hasQuotes || quotes.length === 0) return null;
    const total = quotes.reduce((s, q) => s + (q.price * (q.shares ?? 1)), 0);
    const change = quotes.reduce((s, q) => s + (q.price * (q.shares ?? 1) * (q.changePercent / 100)), 0);
    const pct = total > 0 ? (change / total) * 100 : 0;
    return pct > 0 ? pct : null;
  }, [quotes, hasQuotes]);

  useEffect(() => {
    if (portfolioUpPercent != null && portfolioUpPercent > 0 && !confettiFired) {
      setConfettiFired(true);
    }
  }, [portfolioUpPercent, confettiFired]);

  const [pullStart, setPullStart] = useState<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY < 10) setPullStart(e.touches[0].clientY);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (pullStart != null) setPullStart(null);
  }, [pullStart]);
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (pullStart == null) return;
      const y = e.touches[0].clientY;
      if (y - pullStart > 80) {
        handleRefresh();
        setPullStart(null);
      }
    },
    [pullStart, handleRefresh]
  );

  return (
    <>
      <div
        className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-8 text-foreground">

          {/* Download app – first thing, always visible (static + client button) */}
          <section
            aria-label="Download the app"
            className="rounded-2xl border-2 border-primary/40 bg-primary/10 px-4 py-4 sm:px-5 sm:py-5"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              📲 Get the app
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Install Aktien on your PC for real Windows notifications (bottom-right) when your stocks move.
            </p>
            <InstallAppButton />
          </section>

          <motion.section
            className="space-y-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {getTimeGreeting()}
              </h1>
              {portfolioUpPercent != null && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs font-semibold text-green-400"
                >
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    📈
                  </motion.span>
                  Portfolio +{portfolioUpPercent.toFixed(2)}% today
                </motion.span>
              )}
            </div>
            <p className="text-base text-muted-foreground max-w-md">
              Track prices, set alerts, and get AI-powered portfolio insights.
            </p>
          </motion.section>

          <DataSourceBanner />

          {!databaseConfigured && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
              Stocks and alerts are not saved. Add <code className="rounded bg-white/10 px-1">DATABASE_URL</code> (PostgreSQL) in Vercel → Settings → Environment Variables and redeploy to persist data.
            </div>
          )}

          {lastUpdated && hasQuotes && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Updated <RelativeTime date={lastUpdated} /></span>
              {isLiveData && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${marketOpen ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {marketOpen ? "Market open" : "Market closed"}
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground/80">
                <Keyboard className="h-3.5 w-3.5" />
                Press R to refresh
              </span>
            </div>
          )}

          {notifPermission !== "granted" && notifPermission !== "unsupported" && (
            <button
              onClick={async () => {
                const ok = await requestNotificationPermission();
                setNotifPermission(ok ? "granted" : "denied");
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors"
            >
              <Bell className="h-4 w-4" />
              Enable notifications to get alerted when your stocks move
            </button>
          )}

          <AddStockForm
            onAdded={onStockAdded}
            existingSymbols={hasQuotes ? quotes.map((q) => q.symbol) : []}
          />

          {hasQuotes && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              aria-label="Portfolio summary"
            >
              <h2 className="sr-only">Portfolio summary</h2>
              <PortfolioSummary stocks={quotes} />
            </motion.section>
          )}

          {hasQuotes && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} aria-label="AI overview">
              <AIPortfolioOverview stocks={quotes} isLiveData={isLiveData} openaiConfigured={openaiConfigured} />
            </motion.section>
          )}

          {hasQuotes && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                    <ArrowUpDown className="h-4 w-4" />
                    {sortLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => setSortBy("name")}>Name A–Z</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Price (high to low)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-asc")}>Price (low to high)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("change-desc")}>Best % today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("change-asc")}>Worst % today</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="ml-1.5">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                </Button>
              </motion.div>
            </div>
          )}

          <section className="space-y-4" aria-label="Your stock list">
            {hasQuotes && !firstLoad && filteredAndSortedQuotes.length > 0 && (
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your holdings
              </h2>
            )}
            {firstLoad ? (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } },
                  hidden: {},
                }}
              >
                {[1, 2, 3].map((i) => (
                  <motion.div key={i} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                    <StockCardSkeleton />
                  </motion.div>
                ))}
              </motion.div>
            ) : !hasQuotes ? (
              <EmptyState onAdd={onStockAdded} />
            ) : filteredAndSortedQuotes.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
                No stocks match &quot;{searchQuery}&quot;. Try a different search.
              </div>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
                  },
                  hidden: {},
                }}
              >
                {filteredAndSortedQuotes.map((q, i) => (
                  <motion.div
                    key={q.symbol}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <StockCard
                      stock={q}
                      prevPrice={prevPrices[q.symbol]}
                      chartData={chartDataBySymbol[q.symbol] ?? []}
                      index={i}
                      onClick={() => openDetail(q)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          <DisclaimerBanner />
        </div>
      </div>

      <Confetti active={confettiFired && (portfolioUpPercent ?? 0) > 0} />

      <StockDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stock={modalStock}
        chartLabels={chartLabels}
        chartData={chartData}
        openaiConfigured={openaiConfigured}
      />
    </>
  );
}
