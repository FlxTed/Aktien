"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

interface StockChartProps {
  labels: string[];
  data: number[];
  positive: boolean;
  height?: number;
}

export function StockChart({ labels, data, positive, height = 280 }: StockChartProps) {
  const color = positive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)";
  const borderColor = positive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          borderColor,
          backgroundColor: color,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }),
    [labels, data, color, borderColor]
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000 },
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "hsl(var(--card))",
          titleColor: "hsl(var(--foreground))",
          bodyColor: "hsl(var(--muted-foreground))",
          borderColor: "hsl(var(--border))",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) =>
              `$${typeof ctx.raw === "number" ? ctx.raw.toFixed(2) : ctx.raw}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "hsl(var(--border) / 0.5)" },
          ticks: { color: "hsl(var(--muted-foreground))", maxTicksLimit: 6 },
        },
        y: {
          grid: { color: "hsl(var(--border) / 0.5)" },
          ticks: {
            color: "hsl(var(--muted-foreground))",
            callback: (v) => (typeof v === "number" ? `$${v.toFixed(0)}` : v),
          },
        },
      },
    }),
    []
  );

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
