export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  updatedAt?: number;
  shares?: number;
  buyPrice?: number | null;
  sector?: string | null;
}

export interface ChartPoint {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export type AlertType = "rise" | "drop";
export type AlertKind = "percent" | "absolute";

export interface AlertInput {
  symbol: string;
  type: AlertType;
  kind?: AlertKind;
  percent?: number;
  baseline?: number;
  targetPrice?: number;
}

export interface AIAnalysis {
  summary: string;
  trend: string;
  risks: string;
  outlook: string;
}
