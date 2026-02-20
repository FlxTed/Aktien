"use client";

const PERMISSION_KEY = "aktien-notif-asked";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    localStorage.setItem(PERMISSION_KEY, "true");
  } catch {}

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showNotification(title: string, body: string, tag?: string) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  try {
    const n = new Notification(title, {
      body,
      icon: "/icon-192",
      badge: "/icon-192",
      tag: tag ?? `aktien-${Date.now()}`,
      requireInteraction: false,
      silent: false,
    });
    // Auto-close after 8s
    setTimeout(() => n.close(), 8000);
  } catch {
    // Fallback: some browsers don't support Notification constructor
  }
}

type AlertForCheck = {
  id: string;
  symbol: string;
  type: string;
  kind?: string;
  percent?: number;
  baseline?: number;
  targetPrice?: number | null;
  triggered: boolean;
};

/** Check alerts against current prices and fire notifications */
export function checkAlertsClientSide(
  quotes: { symbol: string; price: number }[],
  alerts: AlertForCheck[]
): string[] {
  const triggered: string[] = [];
  const priceMap = new Map(quotes.map((q) => [q.symbol, q.price]));

  for (const alert of alerts) {
    if (alert.triggered) continue;
    const price = priceMap.get(alert.symbol);
    if (price === undefined) continue;

    const kind = alert.kind ?? "percent";
    let shouldFire = false;
    let message = "";

    if (kind === "absolute" && alert.targetPrice != null) {
      shouldFire =
        (alert.type === "rise" && price >= alert.targetPrice) ||
        (alert.type === "drop" && price <= alert.targetPrice);
      message = `${alert.symbol} ${alert.type === "rise" ? "reached" : "dropped to"} $${price.toFixed(2)} (target $${alert.targetPrice.toFixed(2)})`;
    } else if (alert.baseline != null && alert.percent != null) {
      const change = ((price - alert.baseline) / alert.baseline) * 100;
      shouldFire =
        (alert.type === "rise" && change >= alert.percent) ||
        (alert.type === "drop" && change <= -alert.percent);
      const direction = alert.type === "rise" ? "up" : "down";
      const pct = Math.abs(change).toFixed(1);
      message = `${alert.symbol} is ${direction} ${pct}% from $${alert.baseline.toFixed(2)} to $${price.toFixed(2)}`;
    }

    if (shouldFire) {
      triggered.push(alert.id);
      showNotification(`${alert.symbol} Alert`, message, `alert-${alert.id}`);
    }
  }

  return triggered;
}
