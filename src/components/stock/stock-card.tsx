"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { StockQuote } from "@/types";
import { useCurrency } from "@/lib/currency";
import { MiniChart } from "./mini-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StockCardProps {
  stock: StockQuote;
  prevPrice?: number;
  chartData: number[];
  index: number;
  onClick: () => void;
}

export function StockCard({ stock, prevPrice, chartData, onClick }: StockCardProps) {
  const { formatPrice } = useCurrency();
  const isPositive = stock.changePercent >= 0;
  const shares = stock.shares ?? 1;
  const positionValue = stock.price * shares;
  const buyPrice = stock.buyPrice;
  const hasCostBasis = buyPrice != null && buyPrice > 0;
  const pl = hasCostBasis ? (stock.price - buyPrice) * shares : null;
  const plPercent = hasCostBasis && buyPrice > 0 ? ((stock.price - buyPrice) / buyPrice) * 100 : null;

  const flash = useMemo(() => {
    if (prevPrice === undefined || prevPrice === stock.price) return "";
    return stock.price > prevPrice ? "animate-flash-green" : "animate-flash-red";
  }, [prevPrice, stock.price]);

  return (
    <motion.div
      className="cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        className={`relative overflow-hidden border-border/70 bg-card/95 shadow-soft backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-glow ${flash}`}
      >
        <span
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
            isPositive ? "bg-green-500/70" : "bg-red-500/70"
          }`}
          aria-hidden
        />
        <CardHeader className="pb-2 pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold tracking-tight text-foreground">
                  {stock.symbol}
                </p>
                {stock.sector && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {stock.sector}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {stock.name}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
              </span>
              <span className={`ml-1.5 text-xs tabular-nums ${isPositive ? "text-green-400/80" : "text-red-400/80"}`}>
                ({isPositive ? "+" : ""}{formatPrice(stock.change)})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pl-5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums tracking-tight">
                {formatPrice(shares > 1 ? positionValue : stock.price)}
              </span>
              {shares > 1 && (
                <p className="text-xs text-muted-foreground">
                  {formatPrice(stock.price)} × {shares}
                </p>
              )}
              {hasCostBasis && pl != null && plPercent != null && (
                <p className={`text-xs font-medium tabular-nums ${pl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  P&L {pl >= 0 ? "+" : ""}{formatPrice(pl)} ({pl >= 0 ? "+" : ""}{plPercent.toFixed(1)}%)
                </p>
              )}
            </div>
            <div className="h-12 w-24 flex-shrink-0">
              <MiniChart data={chartData} positive={isPositive} height={48} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
