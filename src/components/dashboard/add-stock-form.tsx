"use client";

import { useState, useMemo } from "react";
import { Plus, Loader2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SUGGESTED_STOCKS, QUICK_ADD_COUNT } from "@/data/suggested-stocks";

export function AddStockForm({
  onAdded,
  existingSymbols = [],
}: {
  onAdded: () => void;
  existingSymbols?: string[];
}) {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [browseFilter, setBrowseFilter] = useState("");
  const { toast } = useToast();

  const quickAdd = useMemo(
    () => SUGGESTED_STOCKS.slice(0, QUICK_ADD_COUNT),
    []
  );
  const browseList = useMemo(() => {
    const rest = SUGGESTED_STOCKS.slice(QUICK_ADD_COUNT);
    const q = browseFilter.trim().toUpperCase();
    if (!q) return rest;
    return rest.filter((s) => s.toUpperCase().includes(q));
  }, [browseFilter]);

  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  const addSymbol = async (sym: string, overrideShares?: number, overrideBuyPrice?: number | null) => {
    const s = sym.trim().toUpperCase();
    if (!s) {
      toast({ title: "Enter a symbol", description: "e.g. AAPL, META, DIS", variant: "destructive" });
      return;
    }
    const numShares = overrideShares ?? (shares ? parseFloat(shares) : 1);
    const numBuy = overrideBuyPrice ?? (buyPrice ? parseFloat(buyPrice) : null);
    const body: { symbol: string; shares?: number; buyPrice?: number | null } = { symbol: s };
    if (numShares > 0 && numShares !== 1) body.shares = numShares;
    if (numBuy != null && numBuy > 0) body.buyPrice = numBuy;

    setLoading(true);
    try {
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Could not add stock",
          description: res.status === 401 ? "Please sign in again." : (data?.error ?? "Unknown error"),
          variant: "destructive",
        });
        return;
      }
      toast({ title: `${s} added`, variant: "success" });
      setSymbol("");
      setShares("");
      setBuyPrice("");
      onAdded();
    } catch {
      toast({ title: "Network error", description: "Check your connection.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card id="add-stock-form" className="rounded-2xl border-border/80 bg-card/95 shadow-soft backdrop-blur-sm">
      <CardContent className="pt-5 pb-5">
        <form
          onSubmit={(e) => { e.preventDefault(); addSymbol(symbol); }}
          className="space-y-3"
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="sym" className="mb-1 block text-xs text-muted-foreground">
                Add stock
              </label>
              <Input
                id="sym"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="rounded-xl"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading} className="rounded-xl shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1.5 h-4 w-4" />Add</>}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <label htmlFor="shares" className="mb-1 block text-xs text-muted-foreground">Shares (optional)</label>
              <Input
                id="shares"
                type="number"
                min="0.0001"
                step="any"
                placeholder="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="rounded-xl"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="buyPrice" className="mb-1 block text-xs text-muted-foreground">Cost basis (optional)</label>
              <Input
                id="buyPrice"
                type="number"
                min="0"
                step="any"
                placeholder="Buy price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="rounded-xl"
                disabled={loading}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Quick add</p>
          <div className="flex flex-wrap gap-1.5">
            {quickAdd.map((s) => {
              const added = existingSymbols.includes(s);
              return (
                <Button
                  key={s}
                  type="button"
                  variant={added ? "ghost" : "outline"}
                  size="sm"
                  className="h-7 rounded-lg px-2.5 text-xs"
                  disabled={loading || added}
                  onClick={() => addSymbol(s, 1, null)}
                >
                  {added ? `${s} ✓` : s}
                </Button>
              );
            })}
          </div>

          <div className="border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-center gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide browse all ({SUGGESTED_STOCKS.length} symbols)
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Browse all ({SUGGESTED_STOCKS.length} symbols)
                </>
              )}
            </Button>
            {showAll && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter symbols..."
                    value={browseFilter}
                    onChange={(e) => setBrowseFilter(e.target.value)}
                    className="h-8 rounded-lg pl-8 text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-muted/30 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {browseList.map((s) => {
                      const added = existingSymbols.includes(s);
                      return (
                        <Button
                          key={s}
                          type="button"
                          variant={added ? "ghost" : "outline"}
                          size="sm"
                          className="h-6 rounded-md px-2 text-xs"
                          disabled={loading || added}
                          onClick={() => addSymbol(s, 1, null)}
                        >
                          {added ? `${s} ✓` : s}
                        </Button>
                      );
                    })}
                    {browseList.length === 0 && (
                      <p className="py-2 text-xs text-muted-foreground">No symbols match.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
