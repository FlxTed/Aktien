"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Currency = "USD" | "EUR";

const STORAGE_KEY = "aktien-currency";
const RATE_CACHE_KEY = "aktien-eur-rate";
const RATE_CACHE_TTL = 3_600_000; // 1 hour
const FALLBACK_RATE = 0.92;

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (price: number) => string;
} | null>(null);

async function fetchEurRate(): Promise<number> {
  try {
    // Try cached rate first
    const cached = localStorage.getItem(RATE_CACHE_KEY);
    if (cached) {
      const { rate, ts } = JSON.parse(cached);
      if (Date.now() - ts < RATE_CACHE_TTL) return rate;
    }
  } catch { /* ignore */ }

  try {
    // Free exchange rate API (no key needed)
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    const rate = data?.rates?.EUR;
    if (typeof rate === "number" && rate > 0) {
      try { localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() })); } catch {}
      return rate;
    }
  } catch { /* ignore */ }

  return FALLBACK_RATE;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [eurRate, setEurRate] = useState(FALLBACK_RATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (stored === "USD" || stored === "EUR") setCurrencyState(stored);
    } catch {}
    setMounted(true);
    // Fetch live EUR rate
    fetchEurRate().then(setEurRate);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch {}
    if (c === "EUR") fetchEurRate().then(setEurRate);
  }, []);

  const formatPrice = useCallback((price: number) => {
    if (!mounted) {
      return new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD",
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(price);
    }
    const value = currency === "EUR" ? price * eurRate : price;
    return new Intl.NumberFormat(currency === "EUR" ? "de-DE" : "en-US", {
      style: "currency",
      currency: currency === "EUR" ? "EUR" : "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [mounted, currency, eurRate]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "USD" as Currency,
      setCurrency: () => {},
      formatPrice: (price: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency", currency: "USD",
          minimumFractionDigits: 2, maximumFractionDigits: 2,
        }).format(price),
    };
  }
  return ctx;
}
