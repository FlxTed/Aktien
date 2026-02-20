"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  format?: "price" | "percent";
  className?: string;
  isPositive?: boolean;
}

export function AnimatedCounter({
  value,
  format = "percent",
  className = "",
  isPositive,
}: AnimatedCounterProps) {
  const safeValue = typeof value === "number" && isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);
  const spring = useSpring(safeValue, { stiffness: 80, damping: 25 });

  useEffect(() => {
    spring.set(safeValue);
  }, [spring, safeValue]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (typeof v === "number" && isFinite(v)) setDisplay(v);
    });
    return () => unsub();
  }, [spring]);

  const num = typeof display === "number" && isFinite(display) ? display : 0;
  const formatted =
    format === "price"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)
      : `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;

  const colorClass =
    isPositive === true
      ? "text-[hsl(var(--success))]"
      : isPositive === false
        ? "text-destructive"
        : "";

  return (
    <span className={`tabular-nums ${colorClass} ${className}`}>
      {formatted}
    </span>
  );
}
