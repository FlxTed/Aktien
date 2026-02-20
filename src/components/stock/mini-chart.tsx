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

interface MiniChartProps {
  data: number[];
  positive: boolean;
  height?: number;
  className?: string;
}

export function MiniChart({ data, positive, height = 48, className }: MiniChartProps) {
  const safeData = useMemo(
    () => (Array.isArray(data) && data.length > 0 ? data : []),
    [data]
  );

  const chartData = useMemo(() => {
    if (safeData.length === 0) return null;
    const labels = safeData.map((_, i) => i);
    const color = positive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)";
    const borderColor = positive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
    return {
      labels,
      datasets: [
        {
          data: safeData,
          borderColor,
          backgroundColor: color,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5,
        },
      ],
    };
  }, [safeData, positive]);

  const options: ChartOptions<"line"> | null = useMemo(() => {
    if (safeData.length === 0) return null;
    const min = Math.min(...safeData);
    const max = Math.max(...safeData);
    const range = max - min || 1;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
      },
      scales: {
        x: { display: false },
        y: {
          display: false,
          min: min - range * 0.1,
          max: max + range * 0.1,
        },
      },
    };
  }, [safeData]);

  if (!chartData || !options) {
    return <div className={className} style={{ height }} />;
  }

  return (
    <div className={className} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
