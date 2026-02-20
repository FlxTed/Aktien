"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface AlertItem {
  id: string;
  symbol: string;
  type: string;
  kind?: string;
  percent?: number;
  baseline?: number;
  targetPrice?: number | null;
  triggered?: boolean;
}

export function AlertsSection({ symbols }: { symbols: string[] }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [addType, setAddType] = useState<"rise" | "drop">("rise");
  const [addKind, setAddKind] = useState<"percent" | "absolute">("percent");
  const [addPercent, setAddPercent] = useState("5");
  const [addBaseline, setAddBaseline] = useState("");
  const [addTargetPrice, setAddTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    const res = await fetch("/api/alerts");
    if (!res.ok) return;
    const data = await res.json();
    setAlerts(data.alerts ?? data);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const addAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = addSymbol.trim().toUpperCase();
    if (!sym) {
      toast({ title: "Pick a symbol", variant: "destructive" });
      return;
    }
    if (addKind === "absolute") {
      const targetPrice = parseFloat(addTargetPrice);
      if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
        toast({ title: "Enter a valid target price", variant: "destructive" });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: sym,
            type: addType,
            kind: "absolute",
            targetPrice,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          toast({ title: d.error ?? "Failed", variant: "destructive" });
          return;
        }
        toast({ title: "Alert set", variant: "success" });
        setAddSymbol("");
        setAddTargetPrice("");
        fetchAlerts();
      } finally {
        setLoading(false);
      }
      return;
    }
    const percent = parseFloat(addPercent);
    const baseline = parseFloat(addBaseline);
    if (!Number.isFinite(percent) || !Number.isFinite(baseline)) {
      toast({ title: "Enter percent and baseline", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sym,
          type: addType,
          kind: "percent",
          percent,
          baseline,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: d.error ?? "Failed", variant: "destructive" });
        return;
      }
      toast({ title: "Alert set", variant: "success" });
      setAddSymbol("");
      setAddPercent("5");
      setAddBaseline("");
      fetchAlerts();
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    fetchAlerts();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border/80 bg-card/50 p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Price alerts</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl">
              Add alert
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New price alert</DialogTitle>
            </DialogHeader>
            <form onSubmit={addAlert} className="space-y-4">
              <div>
                <Label>Symbol</Label>
                <Select
                  value={addSymbol}
                  onValueChange={setAddSymbol}
                  required
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="Pick a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {symbols.length
                      ? symbols.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))
                      : (
                          <>
                            <SelectItem value="AAPL">AAPL</SelectItem>
                            <SelectItem value="TSLA">TSLA</SelectItem>
                            <SelectItem value="NVDA">NVDA</SelectItem>
                            <SelectItem value="GOOGL">GOOGL</SelectItem>
                            <SelectItem value="MSFT">MSFT</SelectItem>
                          </>
                        )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alert type</Label>
                <Select
                  value={addKind}
                  onValueChange={(v: "percent" | "absolute") => setAddKind(v)}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">By % (from baseline)</SelectItem>
                    <SelectItem value="absolute">At target price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notify when price</Label>
                <Select
                  value={addType}
                  onValueChange={(v: "rise" | "drop") => setAddType(v)}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rise">{addKind === "absolute" ? "Rises to or above" : "Rises by %"}</SelectItem>
                    <SelectItem value="drop">{addKind === "absolute" ? "Drops to or below" : "Drops by %"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {addKind === "absolute" ? (
                <div>
                  <Label>Target price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 200"
                    value={addTargetPrice}
                    onChange={(e) => setAddTargetPrice(e.target.value)}
                    className="mt-1 rounded-xl"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Percent (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={addPercent}
                      onChange={(e) => setAddPercent(e.target.value)}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>From price (baseline)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 150"
                      value={addBaseline}
                      onChange={(e) => setAddBaseline(e.target.value)}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? "Adding..." : "Set alert"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {alerts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {alerts.filter((a) => !a.triggered).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"
            >
              <span>
                {a.symbol} — {a.kind === "absolute" && a.targetPrice != null
                  ? `${a.type === "rise" ? "Above" : "Below"} $${a.targetPrice.toFixed(2)}`
                  : `${a.type} by ${a.percent}% from $${(a.baseline ?? 0).toFixed(2)}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteAlert(a.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
