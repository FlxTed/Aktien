"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { useCurrency } from "@/lib/currency";
import type { StockQuote } from "@/types";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

function AnimatedValue({
  value,
  format,
  className,
}: { value: number; format: (n: number) => string; className?: string }) {
  const spring = useSpring(0, { stiffness: 50, damping: 25 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(typeof v === "number" ? v : 0));
    return () => unsub();
  }, [spring]);
  return <span className={className}>{format(display)}</span>;
}

interface PortfolioSummaryProps {
  stocks: StockQuote[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" },
  }),
};

export function PortfolioSummary({ stocks }: PortfolioSummaryProps) {
  const { formatPrice } = useCurrency();

  const totalValue = stocks.reduce((sum, q) => sum + q.price * (q.shares ?? 1), 0);
  const totalChange = stocks.reduce((sum, q) => sum + (q.price * (q.shares ?? 1) * (q.changePercent / 100)), 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;
  const isPositive = totalChangePercent >= 0;

  const best = stocks.length ? [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0] : null;
  const worst = stocks.length ? [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0] : null;

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.div
        variants={cardVariants}
        custom={0}
        className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-soft backdrop-blur-sm"
      >
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <Wallet className="h-4 w-4 text-primary" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider">Portfolio value</span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          <AnimatedValue value={totalValue} format={formatPrice} />
        </p>
        <p className={`mt-1 text-sm font-medium tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
          <AnimatedValue
            value={totalChange}
            format={(n) => `${isPositive ? "+" : ""}${formatPrice(n)}`}
          />
          {" "}today ({isPositive ? "+" : ""}{totalChangePercent.toFixed(2)}%)
        </p>
      </motion.div>

      {best && best.changePercent > 0 && (
        <motion.div
          variants={cardVariants}
          custom={1}
          className="rounded-2xl border border-green-500/25 bg-green-500/10 p-5 shadow-soft"
        >
          <div className="flex items-center gap-2.5 text-green-400/90">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/20">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">Best today</span>
          </div>
          <p className="mt-3 font-bold text-foreground">{best.symbol}</p>
          <p className="text-sm font-semibold text-green-400 tabular-nums">
            +{best.changePercent.toFixed(2)}%
          </p>
        </motion.div>
      )}

      {worst && worst.changePercent < 0 && (
        <motion.div
          variants={cardVariants}
          custom={2}
          className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 shadow-soft"
        >
          <div className="flex items-center gap-2.5 text-red-400/90">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20">
              <TrendingDown className="h-4 w-4 text-red-400" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">Worst today</span>
          </div>
          <p className="mt-3 font-bold text-foreground">{worst.symbol}</p>
          <p className="text-sm font-semibold text-red-400 tabular-nums">
            {worst.changePercent.toFixed(2)}%
          </p>
        </motion.div>
      )}

      <motion.div
        variants={cardVariants}
        custom={3}
        className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-soft backdrop-blur-sm sm:col-span-2 lg:col-span-1"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stocks</span>
        <p className="mt-3 text-2xl font-bold tabular-nums sm:text-3xl">{stocks.length}</p>
        <p className="text-sm text-muted-foreground">in your portfolio</p>
      </motion.div>
    </motion.div>
  );
}
