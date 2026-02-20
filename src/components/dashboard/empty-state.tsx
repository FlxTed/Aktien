"use client";

import { motion } from "framer-motion";
import { TrendingUp, Plus, BarChart3, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const scrollToAdd = () => {
    document.getElementById("add-stock-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <motion.section
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 py-20 px-8 text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="rounded-2xl bg-primary/15 p-6 shadow-soft"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <TrendingUp className="h-12 w-12 text-primary" />
      </motion.div>
      <h2 className="mt-6 text-xl font-bold text-foreground">Build your portfolio</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Add your first stock to track live prices, sparkline charts, price alerts, and AI-powered insights.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Charts
        </span>
        <span className="flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" /> Alerts
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Finn AI
        </span>
      </div>
      <motion.div className="mt-8" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
        <Button onClick={scrollToAdd} size="lg" className="rounded-xl gap-2 shadow-soft">
          <Plus className="h-4 w-4" />
          Add your first stock
        </Button>
      </motion.div>
    </motion.section>
  );
}
