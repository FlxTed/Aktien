"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertsSection } from "./alerts-section";

export function AlertsPageClient() {
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/stocks")
      .then((r) => r.json())
      .then((d) => setSymbols((d.quotes ?? []).map((q: { symbol: string }) => q.symbol)))
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl px-4 py-6"
    >
      <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Get notified when a stock rises or drops by a set percentage.
      </p>
      <div className="mt-6">
        <AlertsSection symbols={symbols} />
      </div>
    </motion.div>
  );
}
